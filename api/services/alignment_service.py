import re
import warnings
from typing import Optional

import torch
import torchaudio

# Suppress torchaudio forced_align deprecation warning (no replacement until 2.9)
warnings.filterwarnings("ignore", message="torchaudio.functional._alignment.forced_align")


# Wav2Vec2 downsamples 320 audio samples per emission frame at 16kHz
SAMPLES_PER_FRAME = 320


class AlignmentService:
    """Forced alignment service using Wav2Vec2 to generate word-level timestamps."""

    def __init__(self):
        self._model = None
        self._labels = None
        self._label_to_idx: dict[str, int] = {}
        self._pipe_idx = -1
        self._sample_rate = 16000

    def _get_model(self):
        """Lazy load the Wav2Vec2 alignment model on CPU."""
        if self._model is None:
            bundle = torchaudio.pipelines.WAV2VEC2_ASR_BASE_960H
            self._model = bundle.get_model().to("cpu")
            self._model.eval()
            self._labels = bundle.get_labels()
            self._sample_rate = bundle.sample_rate
            self._label_to_idx = {label: i for i, label in enumerate(self._labels)}
            self._pipe_idx = self._label_to_idx.get('|', -1)
        return self._model

    def align(
        self,
        wav: torch.Tensor,
        sample_rate: int,
        text: str,
    ) -> Optional[list[dict]]:
        """
        Align audio waveform to text, returning word-level timestamps.

        Returns:
            List of {"w": word, "s": start_seconds, "e": end_seconds} or None on failure
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
    ) -> Optional[list[dict]]:
        model = self._get_model()

        wav = wav.cpu()
        if wav.dim() == 1:
            wav = wav.unsqueeze(0)

        if sample_rate != self._sample_rate:
            wav = torchaudio.functional.resample(wav, sample_rate, self._sample_rate)

        with torch.inference_mode():
            emissions, _ = model(wav)
            emissions = torch.log_softmax(emissions, dim=-1)

        emission = emissions[0].cpu()
        del emissions

        # Tokenize: uppercase, replace whitespace with |, keep only vocab chars
        # Exclude '-' (label index 0) as it conflicts with the CTC blank token
        clean_text = re.sub(r'\s+', '|', text.upper().strip())
        clean_text = ''.join(
            c for c in clean_text
            if c in self._label_to_idx and self._label_to_idx[c] != 0
        )

        if not clean_text:
            return None

        targets = torch.tensor(
            [self._label_to_idx[c] for c in clean_text], dtype=torch.int32
        )

        aligned_tokens, scores = torchaudio.functional.forced_align(
            emission.unsqueeze(0), targets.unsqueeze(0), blank=0
        )

        token_spans = torchaudio.functional.merge_tokens(
            aligned_tokens[0], scores[0]
        )

        # Split original text into words for display labels
        original_words = text.split()

        # Group character spans into words using the | separator token
        time_per_frame = SAMPLES_PER_FRAME / self._sample_rate
        words = []
        current_chars = []
        word_idx = 0

        for span in token_spans:
            if span.token == self._pipe_idx:
                # Word boundary — finalize current word
                if current_chars:
                    words.append(self._make_word(
                        current_chars, original_words, word_idx, time_per_frame
                    ))
                    word_idx += 1
                    current_chars = []
            else:
                current_chars.append(span)

        # Finalize last word
        if current_chars:
            words.append(self._make_word(
                current_chars, original_words, word_idx, time_per_frame
            ))

        return words if words else None

    @staticmethod
    def _make_word(
        char_spans: list,
        original_words: list[str],
        word_idx: int,
        time_per_frame: float,
    ) -> dict:
        word_text = original_words[word_idx] if word_idx < len(original_words) else ""
        return {
            "w": word_text,
            "s": round(char_spans[0].start * time_per_frame, 3),
            "e": round(char_spans[-1].end * time_per_frame, 3),
        }


_alignment_service: AlignmentService | None = None


def get_alignment_service() -> AlignmentService:
    global _alignment_service
    if _alignment_service is None:
        _alignment_service = AlignmentService()
    return _alignment_service
