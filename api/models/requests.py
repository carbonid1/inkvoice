from typing import Optional
from pydantic import BaseModel


class TTSRequest(BaseModel):
    """Request model for text-to-speech generation."""

    text: str
    voice: Optional[str] = None  # voice directory name in data/voices/
    language: Optional[str] = None  # language hint for OmniVoice (e.g. "en", "ru")


class HealthResponse(BaseModel):
    """Response model for health check endpoint."""

    status: str
