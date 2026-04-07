import gc
import io
import time
from pathlib import Path
from typing import Optional, Tuple

import torch
import torchaudio

from api.app.config import settings
from api.services.alignment_service import get_alignment_service
from api.services.opus_encoder import encode_wav_to_opus


CLEANUP_INTERVAL = 20
OMNIVOICE_SAMPLE_RATE = 24000
TRAILING_SILENCE_SECONDS = 0.3


class TTSService:
    """Service for text-to-speech generation using OmniVoice."""

    def __init__(self):
        self._model = None
        self._generation_count = 0

    def _get_model(self):
        """Lazy load the OmniVoice model."""
        if self._model is None:
            import logging
            import os
            os.environ["TRANSFORMERS_VERBOSITY"] = "error"
            logging.getLogger("transformers").setLevel(logging.ERROR)
            from omnivoice import OmniVoice
            # MPS doesn't support fp16 matmul — use fp32 on Apple Silicon, fp16 on CUDA
            dtype = torch.float32 if settings.device == "mps" else torch.float16
            self._model = OmniVoice.from_pretrained(
                "k2-fsa/OmniVoice",
                device_map=settings.device,
                dtype=dtype,
            )
        return self._model

    def get_voice_path(self, voice_name: str) -> Path:
        """Get the path to a voice file, checking app voices then custom voices."""
        voice_path = settings.voices_dir / voice_name / "source.wav"
        if voice_path.exists():
            return voice_path

        custom_path = settings.voices_dir / "custom" / voice_name / "source.wav"
        if custom_path.exists():
            return custom_path

        raise FileNotFoundError(
            f"Voice '{voice_name}' not found. "
            f"Add data/voices/{voice_name}/source.wav or upload via settings."
        )

    def _get_ref_text(self, voice_path: Path) -> Optional[str]:
        """Read pre-computed voice transcript if available."""
        txt_path = voice_path.parent / "source.txt"
        if txt_path.exists():
            return txt_path.read_text().strip()
        return None

    def generate(
        self,
        text: str,
        voice: str | None = None,
    ) -> Tuple[bytes, int, Optional[list[dict]], int, Optional[float]]:
        """
        Generate speech audio from text with optional word-level timestamps.

        Returns:
            Tuple of (audio_bytes, generation_time_ms, word_timestamps_or_none, duration_ms, sampling_rate)
        """
        voice_name = voice or settings.default_voice
        voice_path = self.get_voice_path(voice_name)
        ref_text = self._get_ref_text(voice_path)

        tts_model = self._get_model()
        wav = None
        buffer = None

        try:
            start = time.time()
            with torch.inference_mode():
                audio_list = tts_model.generate(
                    text=text,
                    ref_audio=str(voice_path),
                    ref_text=ref_text,
                )
            wav = audio_list[0]  # First tensor from the list, shape (1, T) at 24kHz
            gen_time_ms = int((time.time() - start) * 1000)

            # Pad silence to prevent trailing word cutoff
            # (non-autoregressive models can underestimate output duration)
            pad = torch.zeros(1, int(OMNIVOICE_SAMPLE_RATE * TRAILING_SILENCE_SECONDS), device=wav.device)
            wav = torch.cat([wav, pad], dim=1)

            # Run forced alignment to get word-level timestamps
            alignment = get_alignment_service()
            timestamps = alignment.align(wav, OMNIVOICE_SAMPLE_RATE, text)

            duration_ms = int(wav.shape[1] / OMNIVOICE_SAMPLE_RATE * 1000)

            # Convert tensor to WAV bytes, then encode to Opus
            buffer = io.BytesIO()
            torchaudio.save(buffer, wav, OMNIVOICE_SAMPLE_RATE, format="wav")
            buffer.seek(0)
            opus_bytes = encode_wav_to_opus(buffer.read())

            return opus_bytes, gen_time_ms, timestamps, duration_ms, None
        finally:
            del wav, buffer
            self._generation_count += 1
            if self._generation_count % CLEANUP_INTERVAL == 0:
                gc.collect()
                if settings.device == "mps":
                    torch.mps.empty_cache()
                elif settings.device == "cuda":
                    torch.cuda.empty_cache()


# Singleton instance
_tts_service: TTSService | None = None


def get_tts_service() -> TTSService:
    """Get the singleton TTS service instance."""
    global _tts_service
    if _tts_service is None:
        _tts_service = TTSService()
    return _tts_service
