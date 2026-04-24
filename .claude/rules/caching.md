# Caching Policy

TTS disk cache is a **user-curated library**, not an opportunistic cache.

- **No automatic eviction.** Nothing is removed without explicit user action.
- **Budget enforcement point is pregen only.** `POST /api/pregenerate/[bookId]` preflights with 15% padding and returns `409` on shortfall. On-demand playback writes bypass the budget.
- **Clearing a book's cache cancels its pregen job** and emits an SSE `deleted` event.
- **TTS cache key**: `sha256(text.trim() + '|' + (voice || 'narrator'))` — keyed by content, not URL (sentence indices shift).
- **TTS HTTP**: `Cache-Control: no-store` both server-side and client fetch — disk cache is source of truth.
