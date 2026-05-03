import json
import os
import sys
import threading
import traceback
import warnings

# Suppress non-actionable library warnings:
# - FutureWarning from torch/diffusers about deprecated internal APIs
# - UserWarning from pkg_resources
# - transformers logger: suppressed in tts_service._get_model() (must run after library import)
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", message="pkg_resources is deprecated")

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import Response

from api.models.requests import TTSRequest, HealthResponse
from api.services.text_preprocessing import normalize_ellipsis
from api.services.tts_service import get_tts_service


def _watch_parent():
    """Exit when the parent process (Electron) dies.

    Detects parent death via stdin EOF — when the parent is killed for any
    reason, the OS closes the pipe and stdin.read() returns empty.
    """
    sys.stdin.read()
    os._exit(0)


if os.environ.get("INKVOICE_PARENT_PID"):
    thread = threading.Thread(target=_watch_parent, daemon=True)
    thread.start()

app = FastAPI(title="InkVoice TTS API")


@app.post("/tts")
def text_to_speech(request: TTSRequest) -> Response:
    """Generate speech audio from text."""
    text = request.text.strip() if request.text else ""
    text = normalize_ellipsis(text)
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        preview = text[:80] + ("..." if len(text) > 80 else "")
        print(f"[tts] Generating: \"{preview}\"")
        service = get_tts_service()
        audio_bytes, gen_time_ms, timestamps, duration_ms, sampling_rate = service.generate(
            text=text,
            voice=request.voice,
        )
        print(f"[tts] Done in {gen_time_ms}ms ({duration_ms}ms audio)")

        headers = {
            "Content-Disposition": "attachment; filename=speech.ogg",
            "X-Generation-Time-Ms": str(gen_time_ms),
            "X-Audio-Duration-Ms": str(duration_ms),
        }

        if sampling_rate is not None:
            headers["X-Sampling-Rate"] = f"{sampling_rate:.1f}"

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
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/transcribe")
async def transcribe_audio(request: Request, language: str | None = None):
    """Transcribe audio using Whisper for voice reference text.

    `language` is an optional ISO 639-1 hint (e.g. "en", "ru", "uk") passed as a query param.
    """
    import tempfile
    body = await request.body()
    if not body:
        raise HTTPException(status_code=400, detail="No audio data provided")

    try:
        import whisper
        model = whisper.load_model("base")
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as f:
            f.write(body)
            f.flush()
            kwargs = {"language": language} if language else {}
            result = model.transcribe(f.name, **kwargs)
        del model
        return {"text": result["text"].strip()}
    except Exception as e:
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check() -> HealthResponse:
    """Check if the service is healthy."""
    return HealthResponse(status="ok")
