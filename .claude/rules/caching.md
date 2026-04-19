# Caching

## Layers

| Layer                | Type               | Location                | Eviction             | Key                            |
| -------------------- | ------------------ | ----------------------- | -------------------- | ------------------------------ |
| TTS audio            | Disk (SHA256)      | `data/cache/tts/*.opus` | LRU, 800 MB          | `sha256(text + '\|' + voice)`  |
| Parsed books         | In-memory Map      | `BookService` singleton | FIFO, 5 books        | Book ID                        |
| Prefetch tracking    | In-memory Set      | `usePrefetchQueue` refs | On unmount           | `{chapter}_{sentence}_{voice}` |
| Reading progress     | SQLite             | `data/inkvoice-dev.db`  | Never                | Book ID                        |
| Voice files / covers | HTTP               | Browser                 | 1 year (`immutable`) | URL path                       |
| TTS model weights    | Disk (HuggingFace) | `~/.cache/huggingface/` | Never                | Model ID                       |

## TTS Audio Disk Cache

**Service:** `src/lib/services/cache/cache.service.ts` (singleton)

- Key: `sha256(text.trim() + '|' + (voice || 'narrator'))` → `data/cache/tts/{hash}.opus`
- Metadata: `data/cache/tts/metadata.json` (size, access times, creation times)
- Max size: 800 MB default, configurable via `INKVOICE_MAX_CACHE_SIZE_MB`
- Updates `lastAccess` on hits for LRU ordering
- Env config: `src/lib/config/env.ts` (`INKVOICE_CACHE_DIR`, `INKVOICE_MAX_CACHE_SIZE_MB`)

## TTS Route Cache Flow

**Route:** `src/app/api/tts/[bookId]/[chapter]/[sentence]/route.ts`

1. Request in → cache key generated from raw text
2. HIT → return WAV, `X-Cache: HIT`
3. MISS → call Python TTS API → save to disk → return WAV, `X-Cache: MISS`
4. Always returns `X-Cache-Used` / `X-Cache-Max` headers (displayed in debug panel)

## HTTP Cache Headers

- **TTS audio:** `Cache-Control: no-store` (server response) + `cache: 'no-store'` (client fetch option) — browser must never cache by URL since sentence indices can shift (ellipsis handling, text changes). Both sides are needed: the server header prevents future caching, the client fetch option bypasses any pre-existing cached responses. Disk cache keyed by text content is the source of truth.
- **Voice files / covers:** `Cache-Control: public, max-age=31536000, immutable`

## Parsed Book Cache

**Service:** `src/lib/services/book/book.service.ts` (singleton)

- In-memory Map of parsed EPUB `ParsedBook` objects
- FIFO eviction at 5 books
- Avoids re-parsing EPUBs on every TTS request

## Client-Side Prefetch Tracking

**Hook:** `src/lib/hooks/usePrefetchQueue/usePrefetchQueue.ts`

- `prefetchedRef`: Set of completed fetches
- `inFlightRef`: Set of in-progress fetches
- Both `continuePrefetching` and `fetchAudio` use `cache: 'no-store'` on fetch requests
- `continuePrefetching` fires fetch requests to warm server disk cache but does not store blob URLs — only marks keys as prefetched and reads `X-Cache` headers
- `fetchAudio` makes a separate fetch, consumes the response as a blob, and returns a `URL.createObjectURL(blob)` for the `<audio>` element
- Reads `X-Cache-Used` / `X-Cache-Max` response headers for debug panel stats
- Aborts all in-flight requests on unmount
- Not persisted across sessions

## Clearing Cache

- **Disk cache:** `rm -rf data/cache/tts/*` then restart dev server (kills in-memory singleton metadata)
- **In-memory singletons** (`CacheService`, `BookService`): restart dev server
- **Client blob URLs / prefetch tracking:** refresh the page
- **Browser HTTP cache:** only relevant if `cache: 'no-store'` is accidentally removed from client fetch calls — would require Chrome DevTools → Application → Clear site data
