import io
import time
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
import torch
import torchaudio

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


class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = None  # voice directory name in data/voices/
    exaggeration: float = 0.7  # 0.0-1.0, controls expressiveness


@app.post("/tts")
async def text_to_speech(request: TTSRequest):
    text = request.text.strip() if request.text else ""

    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        model = get_model()

        # Turbo requires a voice file
        voice_name = request.voice or DEFAULT_VOICE
        voice_path = VOICES_DIR / voice_name / "source.wav"

        if not voice_path.exists():
            raise HTTPException(
                status_code=400,
                detail=f"Voice '{voice_name}' not found. Add data/voices/{voice_name}/source.wav"
            )

        start = time.time()
        with torch.inference_mode():
            wav = model.generate(
                text,
                audio_prompt_path=str(voice_path),
                exaggeration=request.exaggeration,
                cfg_weight=0.5,
            )
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


@app.on_event("startup")
async def warmup():
    """Pre-load model and run a test generation to warm up JIT compilation."""
    # Find any voice file to use for warmup
    voice_files = list(VOICES_DIR.glob("*/source.wav"))
    if not voice_files:
        print("Warning: No voice files found, skipping warmup")
        return

    print("Warming up TTS model...")
    start = time.time()
    model = get_model()

    with torch.inference_mode():
        model.generate("Hello.", audio_prompt_path=str(voice_files[0]))

    print(f"Model ready in {time.time() - start:.1f}s")
