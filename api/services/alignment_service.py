import warnings
from typing import Optional, TypedDict

import torch
import torchaudio
import uroman as ur

# Suppress torchaudio forced_align deprecation warning (no replacement until 2.9)
warnings.filterwarnings("ignore", message="torchaudio.functional._alignment.forced_align")


# Wav2Vec2 downsamples 320 audio samples per emission frame at 16kHz
SAMPLES_PER_FRAME = 320


class WordAlignment(TypedDict):
    w: str
    s: float
    e: float


class AlignmentService:
    """Multilingual forced alignment using MMS_FA (wav2vec2 + uroman romanization)."""

    def __init__(self):
        self._model = None
        self._tokenizer = None
        self._aligner = None
        self._uroman: Optional[ur.Uroman] = None
        self._vocab: set[str] = set()
        self._sample_rate = 16000

    def _get_model(self):
        if self._model is None:
            bundle = torchaudio.pipelines.MMS_FA
            self._model = bundle.get_model().to("cpu")
            self._model.eval()
            self._tokenizer = bundle.get_tokenizer()
            self._aligner = bundle.get_aligner()
            self._sample_rate = bundle.sample_rate
            # Blank "-" (index 0) is forbidden in forced_align targets;
            # star "*" is reserved for uncertain regions.
            self._vocab = set(bundle.get_labels()) - {"-", "*"}
            self._uroman = ur.Uroman()
        return self._model

    def align(
        self,
        wav: torch.Tensor,
        sample_rate: int,
        text: str,
    ) -> Optional[list[WordAlignment]]:
        """
        Align audio waveform to text, returning word-level timestamps.

        Words that reduce to no alignable characters (pure punctuation, unsupported
        script) are omitted — consumers must match on the original word text.
        """
        try:
            return self._align_impl(wav, sample_rate, text)
        except Exception as e:
            print(f"[alignment] Failed: {e}")
            return None

    def _align_impl(
        self,
        wav: torch.Tensor,
        sample_rate: int,
        text: str,
    ) -> Optional[list[WordAlignment]]:
        self._get_model()

        original_words = text.split()
        if not original_words:
            return None

        # Romanize the whole string (not word-by-word) so whitespace is preserved
        # and we can re-split to get a 1:1 word mapping back to the original.
        # Skip uroman entirely for pure ASCII — English is the common case.
        if text.isascii():
            romanized_words = original_words
        else:
            romanized_words = self._uroman.romanize_string(text).split()
            if len(romanized_words) != len(original_words):
                print(f"[alignment] Romanization word-count mismatch: "
                      f"{len(original_words)} -> {len(romanized_words)}")
                return None

        cleaned: list[tuple[str, str]] = []
        for original, romanized in zip(original_words, romanized_words):
            filtered = "".join(c for c in romanized.lower() if c in self._vocab)
            if filtered:
                cleaned.append((original, filtered))

        if not cleaned:
            return None

        wav = wav.cpu()
        if wav.dim() == 1:
            wav = wav.unsqueeze(0)

        if sample_rate != self._sample_rate:
            wav = torchaudio.functional.resample(wav, sample_rate, self._sample_rate)

        with torch.inference_mode():
            emissions, _ = self._model(wav)
            emissions = torch.log_softmax(emissions, dim=-1)

        emission = emissions[0].cpu()
        del emissions

        tokens = self._tokenizer([w for _, w in cleaned])
        word_spans = self._aligner(emission, tokens)

        time_per_frame = SAMPLES_PER_FRAME / self._sample_rate
        result: list[WordAlignment] = []
        for (original, _), spans in zip(cleaned, word_spans):
            if not spans:
                continue
            result.append({
                "w": original,
                "s": round(spans[0].start * time_per_frame, 3),
                "e": round(spans[-1].end * time_per_frame, 3),
            })

        return result if result else None


_alignment_service: AlignmentService | None = None


def get_alignment_service() -> AlignmentService:
    global _alignment_service
    if _alignment_service is None:
        _alignment_service = AlignmentService()
    return _alignment_service
