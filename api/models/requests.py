from typing import Optional
from pydantic import BaseModel


class TTSRequest(BaseModel):
    """Request model for text-to-speech generation."""

    text: str
    voice: Optional[str] = None  # voice directory name in data/voices/


class TTSDesignRequest(BaseModel):
    """Request model for OmniVoice voice-design synthesis (no reference audio).

    `instruct` follows OmniVoice's speaker-attribute syntax — e.g.
    "female, young adult, high pitch, british accent".
    """

    text: str
    instruct: str
    format: Optional[str] = "opus"  # "opus" for preview, "wav" to persist as reference
    class_temperature: Optional[float] = None  # 0.0–1.0, OmniVoice default 0.3
    seed: Optional[int] = None  # if set, makes the take reproducible


class HealthResponse(BaseModel):
    """Response model for health check endpoint."""

    status: str
