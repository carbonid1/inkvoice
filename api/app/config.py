from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    voices_dir: Path = Path(__file__).parent.parent.parent / "data" / "voices"
    # Must match DEFAULT_VOICE in src/lib/services/voice/voice.consts.ts.
    # Fallback only — every TS caller already passes voice explicitly.
    default_voice: str = "clara"
    device: str = "mps"  # mps for Apple Silicon, cuda for NVIDIA, cpu for fallback

    class Config:
        env_prefix = "INKVOICE_"


settings = Settings()
