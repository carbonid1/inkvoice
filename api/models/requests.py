from typing import Optional
from pydantic import BaseModel


class TTSRequest(BaseModel):
    """Request model for text-to-speech generation."""

    text: str
    voice: Optional[str] = None  # voice directory name in data/voices/
    exaggeration: float = 0.7  # 0.0-1.0, controls expressiveness


class HealthResponse(BaseModel):
    """Response model for health check endpoint."""

    status: str
