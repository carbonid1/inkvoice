from typing import Literal, Optional
from pydantic import BaseModel


class TTSRequest(BaseModel):
    """Request model for text-to-speech generation."""

    text: str
    voice: Optional[str] = None  # voice directory name in data/voices/
    model: Literal["turbo", "standard"] = "turbo"


class HealthResponse(BaseModel):
    """Response model for health check endpoint."""

    status: str
