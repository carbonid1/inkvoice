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
from api.services.tqdm_capture import get_sampling_rate


CLEANUP_INTERVAL = 20


class TTSService:
    """Service for text-to-speech generation using Chatterbox TTS."""

    def __init__(self):
        self._model = None
        self._generation_count = 0

    def _get_model(self):
        """Lazy load the Chatterbox model."""
        if self._model is None:
            import logging
            import os
            # Suppress transformers/torch warnings during model load
            # (they reconfigure their own loggers during import, so setLevel alone doesn't work)
            os.environ["TRANSFORMERS_VERBOSITY"] = "error"
            logging.getLogger("transformers").setLevel(logging.ERROR)
            from chatterbox.tts import ChatterboxTTS
            self._model = ChatterboxTTS.from_pretrained(device=settings.device)
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

        tts_model = self._get_model()
        wav = None
        buffer = None

        try:
            start = time.time()
            with torch.inference_mode():
                wav = tts_model.generate(
                    text,
                    audio_prompt_path=str(voice_path),
                )
            gen_time_ms = int((time.time() - start) * 1000)
            sampling_rate = get_sampling_rate()

            # Run forced alignment to get word-level timestamps
            alignment = get_alignment_service()
            timestamps = alignment.align(wav, tts_model.sr, text)

            duration_ms = int(wav.shape[1] / tts_model.sr * 1000)

            # Convert tensor to WAV bytes, then encode to Opus
            buffer = io.BytesIO()
            torchaudio.save(buffer, wav, tts_model.sr, format="wav")
            buffer.seek(0)
            opus_bytes = encode_wav_to_opus(buffer.read())

            return opus_bytes, gen_time_ms, timestamps, duration_ms, sampling_rate
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
