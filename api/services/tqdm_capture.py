"""Monkey-patch tqdm to capture the final sampling rate (it/s) from Chatterbox.

Must be imported before Chatterbox is loaded so the patch is in place
when T3's sampling loop creates its tqdm progress bar.
"""

import threading

import tqdm

_local = threading.local()

_original_close = tqdm.tqdm.close


def _patched_close(self):
    try:
        rate = self.format_dict.get('rate')
        if rate:
            _local.sampling_rate = rate
    except Exception:
        pass
    _original_close(self)


tqdm.tqdm.close = _patched_close


def get_sampling_rate() -> float | None:
    """Return the it/s from the most recent tqdm bar on this thread, or None."""
    rate = getattr(_local, 'sampling_rate', None)
    _local.sampling_rate = None
    return rate
