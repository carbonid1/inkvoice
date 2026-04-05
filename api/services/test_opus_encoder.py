import wave
import io

import pytest


def _make_wav(duration_s: float = 0.1, sample_rate: int = 24000) -> bytes:
    """Generate a minimal silent WAV for testing."""
    num_samples = int(sample_rate * duration_s)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        w.writeframes(b"\x00\x00" * num_samples)
    return buf.getvalue()


class TestEncodeWavToOpus:
    def test_produces_valid_ogg_opus_bytes(self):
        from api.services.opus_encoder import encode_wav_to_opus

        wav_bytes = _make_wav()
        result = encode_wav_to_opus(wav_bytes)

        assert result[:4] == b"OggS", "Output should start with OGG magic bytes"
        assert len(result) > 0
        assert len(result) < len(wav_bytes), "Opus should be smaller than WAV"

    def test_raises_on_invalid_input(self):
        from api.services.opus_encoder import encode_wav_to_opus

        with pytest.raises(RuntimeError, match="ffmpeg opus encoding failed"):
            encode_wav_to_opus(b"not valid audio data")
