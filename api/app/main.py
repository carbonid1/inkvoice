import json
import warnings

# Suppress non-actionable library warnings:
# - FutureWarning from torch/diffusers about deprecated internal APIs
# - UserWarning from pkg_resources (used by perth/Chatterbox dependency)
# - transformers logger: suppressed in tts_service._get_model() (must run after library import)
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", message="pkg_resources is deprecated")

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response

from api.models.requests import TTSRequest, HealthResponse
from api.services.text_preprocessing import normalize_ellipsis
from api.services.tts_service import get_tts_service

app = FastAPI(title="InkVoice TTS API")


@app.post("/tts")
def text_to_speech(request: TTSRequest) -> Response:
    """Generate speech audio from text."""
    text = request.text.strip() if request.text else ""
    text = normalize_ellipsis(text)
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        service = get_tts_service()
        audio_bytes, gen_time_ms, timestamps, duration_ms = service.generate(
            text=text,
            voice=request.voice,
        )

        headers = {
            "Content-Disposition": "attachment; filename=speech.ogg",
            "X-Generation-Time-Ms": str(gen_time_ms),
            "X-Audio-Duration-Ms": str(duration_ms),
        }

        if timestamps is not None:
            headers["X-Word-Timestamps"] = json.dumps(timestamps, separators=(',', ':'))

        return Response(
            content=audio_bytes,
            media_type="audio/ogg",
            headers=headers,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check() -> HealthResponse:
    """Check if the service is healthy."""
    return HealthResponse(status="ok")
