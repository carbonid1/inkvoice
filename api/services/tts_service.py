import io
import time
from pathlib import Path
from typing import Literal, Tuple

import torch
import torchaudio

from api.app.config import settings


class TTSService:
    """Service for text-to-speech generation using Chatterbox TTS models."""

    def __init__(self):
        self._turbo_model = None
        self._standard_model = None

    def _get_turbo_model(self):
        """Lazy load the Chatterbox Turbo model."""
        if self._turbo_model is None:
            from chatterbox.tts_turbo import ChatterboxTurboTTS
            self._turbo_model = ChatterboxTurboTTS.from_pretrained(device=settings.device)
        return self._turbo_model

    def _get_standard_model(self):
        """Lazy load the Chatterbox Standard model."""
        if self._standard_model is None:
            from chatterbox.tts import ChatterboxTTS
            self._standard_model = ChatterboxTTS.from_pretrained(device=settings.device)
        return self._standard_model

    def _get_model(self, model: Literal["turbo", "standard"]):
        if model == "standard":
            return self._get_standard_model()
        return self._get_turbo_model()

    def get_voice_path(self, voice_name: str) -> Path:
        """Get the path to a voice file, raising an error if not found."""
        voice_path = settings.voices_dir / voice_name / "source.wav"
        if not voice_path.exists():
            raise FileNotFoundError(
                f"Voice '{voice_name}' not found. Add data/voices/{voice_name}/source.wav"
            )
        return voice_path

    def generate(
        self,
        text: str,
        voice: str | None = None,
        model: Literal["turbo", "standard"] = "turbo",
    ) -> Tuple[bytes, int]:
        """
        Generate speech audio from text.

        Returns:
            Tuple of (audio_bytes, generation_time_ms)
        """
        voice_name = voice or settings.default_voice
        voice_path = self.get_voice_path(voice_name)

        tts_model = self._get_model(model)

        start = time.time()
        with torch.inference_mode():
            wav = tts_model.generate(
                text,
                audio_prompt_path=str(voice_path),
            )
        gen_time_ms = int((time.time() - start) * 1000)

        # Convert to bytes
        buffer = io.BytesIO()
        torchaudio.save(buffer, wav, tts_model.sr, format="wav")
        buffer.seek(0)

        return buffer.read(), gen_time_ms

    def warmup(self) -> None:
        """Pre-load turbo model and run a test generation to warm up JIT compilation."""
        voice_files = list(settings.voices_dir.glob("*/source.wav"))
        if not voice_files:
            print("Warning: No voice files found, skipping warmup")
            return

        print("Warming up TTS turbo model...")
        start = time.time()

        with torch.inference_mode():
            self._get_turbo_model().generate("Hello.", audio_prompt_path=str(voice_files[0]))

        print(f"Turbo model ready in {time.time() - start:.1f}s")


# Singleton instance
_tts_service: TTSService | None = None


def get_tts_service() -> TTSService:
    """Get the singleton TTS service instance."""
    global _tts_service
    if _tts_service is None:
        _tts_service = TTSService()
    return _tts_service
