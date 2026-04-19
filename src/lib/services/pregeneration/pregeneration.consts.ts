export const WARMUP_TIMEOUT_MS = 180_000

// Long enough (~500 chars) to exercise the full inference path, not just weight
// loading — a short string can return before the model is actually ready for
// realistic paragraph-sized requests.
export const WARMUP_TEXT =
  'The morning sun cast long shadows across the cobblestone street as the old merchant opened his shop for the first time in years. Dust motes danced in the golden light that streamed through the windows, illuminating rows of forgotten treasures on the shelves. He paused for a moment, breathing in the familiar scent of aged wood and leather, remembering the countless customers who had once filled this space with laughter and conversation. Today would be different, he told himself, adjusting the sign that hung crookedly above the door.'

export const POLL_INTERVAL_MS = 5000
export const MIN_DISK_FREE_BYTES = 2 * 1024 * 1024 * 1024 // 2 GB
export const CACHED_SKIP_EMIT_INTERVAL = 10
export const DISK_CHECK_INTERVAL = 50
export const MAX_RETRIES_PER_PARAGRAPH = 5
export const BASE_BACKOFF_MS = 2_000
export const MAX_BACKOFF_MS = 30_000
