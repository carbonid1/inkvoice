import re


def normalize_ellipsis(text: str) -> str:
    """Collapse spaced dot sequences ('. . .') into standard ellipsis ('...').

    Spaced dots like '. . .' can confuse TTS sentence boundary detection.
    Normalizing to '...' produces cleaner audio output.
    """
    return re.sub(r"(?:\.\s+){2,}\.", "...", text)
