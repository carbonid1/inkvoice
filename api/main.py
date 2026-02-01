import io
import hashlib
import time
from pathlib import Path

from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

app = FastAPI(title="InkVoice TTS API")

VOICES_DIR = Path(__file__).parent.parent / "data" / "voices"

# Lazy load the model to avoid startup delay
_model = None


def get_model():
    global _model
    if _model is None:
        from chatterbox.tts import ChatterboxTTS
        _model = ChatterboxTTS.from_pretrained(device="mps")
    return _model


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

        # Resolve voice reference audio path
        audio_prompt_path = None
        if request.voice:
            voice_path = VOICES_DIR / f"{request.voice}.wav"
            if voice_path.exists():
                audio_prompt_path = str(voice_path)
            else:
                raise HTTPException(
                    status_code=404,
                    detail=f"Voice '{request.voice}' not found. Add {request.voice}.wav to data/voices/"
                )

        start = time.time()
        wav = model.generate(
            request.text,
            audio_prompt_path=audio_prompt_path,
            exaggeration=request.exaggeration,
            cfg_weight=0.5,  # Default: preserves accent from reference voice
        )
        gen_time_ms = int((time.time() - start) * 1000)

        # Convert to bytes
        buffer = io.BytesIO()
        import torchaudio
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
