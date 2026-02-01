import io
import time
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
import torchaudio
import torchaudio.functional as F

app = FastAPI(title="InkVoice TTS API")

VOICES_DIR = Path(__file__).parent.parent / "data" / "voices"
DEFAULT_VOICE = "default"

# Lazy load the model to avoid startup delay
_model = None


def get_model():
    global _model
    if _model is None:
        from chatterbox.tts_turbo import ChatterboxTurboTTS
        _model = ChatterboxTurboTTS.from_pretrained(device="mps")
    return _model


def trim_silence(wav, sr, threshold_db=-40):
    """Remove leading/trailing silence from audio using VAD."""
    return F.vad(wav, sample_rate=sr)


class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = None  # filename (without extension) in data/voices/
    exaggeration: float = 0.5  # 0.0-1.0, controls expressiveness


@app.post("/tts")
async def text_to_speech(request: TTSRequest):
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        model = get_model()

        # Turbo requires a voice file
        voice_name = request.voice or DEFAULT_VOICE
        voice_path = VOICES_DIR / f"{voice_name}.wav"

        if not voice_path.exists():
            raise HTTPException(
                status_code=400,
                detail=f"Voice '{voice_name}' not found. Add {voice_name}.wav to data/voices/"
            )

        start = time.time()
        wav = model.generate(
            request.text,
            audio_prompt_path=str(voice_path),
            exaggeration=request.exaggeration,
            cfg_weight=0.5,
        )

        # Trim silence for smoother sentence transitions
        wav = trim_silence(wav, model.sr)

        gen_time_ms = int((time.time() - start) * 1000)

        # Convert to bytes
        buffer = io.BytesIO()
        torchaudio.save(buffer, wav, model.sr, format="wav")
        buffer.seek(0)

        return Response(
            content=buffer.read(),
            media_type="audio/wav",
            headers={
                "Content-Disposition": "attachment; filename=speech.wav",
                "X-Generation-Time-Ms": str(gen_time_ms),
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    return {"status": "ok"}
