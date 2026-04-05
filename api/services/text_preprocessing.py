import re


def normalize_ellipsis(text: str) -> str:
    """Collapse spaced dot sequences ('. . .') into standard ellipsis ('...').

    Chatterbox's built-in punc_norm converts '...' to ', ' (a natural pause),
    but spaced dots like '. . .' slip through as individual periods, confusing
    the model's sentence boundary detection and producing mangled audio.
    Normalizing to '...' lets punc_norm handle them correctly.
    """
    return re.sub(r"(?:\.\s+){2,}\.", "...", text)
