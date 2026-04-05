# Pre-Generation Design

## Overview

Generate-first architecture: pre-generate an entire book's audio before playback. The player reads from cache only — no on-demand TTS generation. One generation path, one playback path, no contention.

## How we got here

Built a dual-generation system over ~9 parts: runtime on-demand TTS (player hits API, generates if not cached) and background pre-generation (worker generates entire book). This required a priority scheduler (`ttsScheduler`), prefetch queue with buffer visualization, pause/resume contention when opening a book during pre-gen. Even a massive book (Series's large epub) fits under 1GB of Opus audio. The dual-path complexity wasn't justified.

## Architecture

### Generation path

Pre-gen worker → TTS service → disk cache. Single path, no alternatives.

- **Worker** (`pregeneration.service.ts`): polls SQLite queue, processes one paragraph at a time
- **Always iterates from chapter 0, paragraph 0**: skips cached paragraphs via `cacheService.has()` (in-memory hash lookup, sub-second even for huge books)
- **DB pointer** (`currentChapter`/`currentParagraph`): progress display only, not used for resume. Cache is the source of truth — if pointer is wrong, worker self-heals by scanning through cached paragraphs
- **Retry**: 5 attempts per paragraph, exponential backoff (2s→4s→8s→16s→30s cap). Pauses job after exhausting retries
- **Disk space guard**: pauses if <10% disk free

### Playback path

Player → TTS route (cache-only) → disk cache.

- **TTS route** returns cached audio or 404. No generation capability.
- **Player** fetches audio, creates blob URL, plays. Stops silently at uncached paragraph boundary.
- **Word timestamps** served from cache sidecar, encoded in response header. Highlighting works unchanged.

### Generation trigger

BookCard context menu → "Pre-generate Audio" → `POST /api/pregenerate/{bookId}`. FIFO queue, sequential processing. Pause/resume/cancel from same menu.

### Progress visibility

- **BookCard ProgressRing**: shows generation progress on home page (existing)
- **Debug panel** (`D` shortcut): overlay showing queue — book title, status, paragraph progress, errors. Accessible on any page. Temporary dev UI, will become a polished floating panel.
- **SSE** (`usePregenSSE`): mounted in root layout via `PregenSSEProvider`, active on every page

## Decisions

| Decision                          | Rationale                                                                                                  |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Cache-only TTS route              | Generation only through worker. If something isn't cached, that's a bug — surface it, don't paper over it. |
| Always start from 0,0             | DB pointer can jump ahead and miss gaps. Cache-skip is sub-second. No edge cases.                          |
| Player stops silently at boundary | Simplest behavior for POC. No error state needed.                                                          |
| No pause/resume on book open      | No contention to manage — generation and playback don't compete.                                           |
| Worker calls TTS directly         | No scheduler needed with single generation path.                                                           |

## Voice selection

Use whatever voice resolves at trigger time: per-book override > global default. No voice picker in pre-gen flow. If user changes voice after pre-gen, old cache stays (different hash key). LRU evicts naturally.

## Queue behavior

- **FIFO ordering.** Process in order added.
- **Sequential processing.** One book, one paragraph at a time.
- **Persistent in SQLite.** Survives app restarts.
- **Auto-recovery**: on module re-evaluation (HMR/restart), resets orphaned in_progress jobs back to queued and restarts worker.

## Failure handling

- Retry per paragraph with exponential backoff, then pause job.
- Error message stored in DB, visible in debug panel and SSE.
- `console.warn` on each retry attempt for developer visibility.

## Cache

- **Opus encoding** in Python TTS backend. ~10x storage reduction over WAV.
- **Default max: 10 GB** (or available disk minus 10% safety margin).
- **Eviction**: finished books first > LRU. Never auto-evict active pre-gen content.
- **Key**: `sha256(text + '|' + voice)` — content-addressed, survives paragraph index shifts.

## File architecture

```
src/lib/services/pregeneration/
  pregeneration.service.ts        # Background worker with retry/backoff

src/lib/services/pregenQueue/
  pregenQueue.service.ts          # SQLite job CRUD
  pregenQueue.types.ts            # Job type, status constants

src/lib/services/pregenEvents/
  pregenEvents.service.ts         # SSE event emitter

src/app/api/pregenerate/
  [bookId]/route.ts               # POST (start), GET (status), PATCH (pause/resume), DELETE (cancel)
  estimate/[bookId]/route.ts      # Size/time estimate
  events/route.ts                 # SSE stream

src/components/PregenSSEProvider/ # Root-level SSE + debug panel wrapper
src/components/DebugPanel/        # D-shortcut queue overlay
src/store/usePregenStore.ts       # Client-side job state
src/lib/hooks/usePregenSSE/       # SSE connection hook
```

## Direction

1. **Validate POC** — generate a full book, listen through, confirm experience
2. **Polished queue UI** — floating download-tray panel replacing debug overlay
3. **Book state visualization** — BookCard distinguishes: not generated / generating / paused / partial / ready
4. **Partial playback** — play generated chapters while rest is still generating
5. **E2E test infrastructure** — tests needing audio playback require pre-gen step in fresh environments
