export const WARMUP_TIMEOUT_MS = 180_000

// One realistic sentence: long enough that OmniVoice returns a normal 2-D
// torch tensor (very short inputs return 1-D numpy and crash post-processing),
// short enough to stay under the 30 s audio_chunk_threshold that puts inference
// on the chunked-generate path (its peak MPS allocation OOMs on 24 GB Macs).
export const WARMUP_TEXT = 'This is a short sample sentence used to warm up the model.'

export const POLL_INTERVAL_MS = 5000
export const MIN_DISK_FREE_BYTES = 2 * 1024 * 1024 * 1024 // 2 GB
export const CACHED_SKIP_EMIT_INTERVAL = 10
export const DISK_CHECK_INTERVAL = 50
export const MAX_RETRIES_PER_PARAGRAPH = 5
export const BASE_BACKOFF_MS = 2_000
export const MAX_BACKOFF_MS = 30_000
