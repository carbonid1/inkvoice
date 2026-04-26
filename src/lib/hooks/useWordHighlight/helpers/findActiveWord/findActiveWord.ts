import type { WordTimestamp } from '@/lib/types/wordTimestamp'

const LOOKAHEAD_MS = 0.03

/**
 * Binary search for the word being spoken at `currentTime`.
 * Returns the index into the timestamps array, or -1 if timestamps are empty.
 */
export const findActiveWord = (currentTime: number, timestamps: WordTimestamp[]): number => {
  if (timestamps.length === 0) return -1

  // Before first word — snap to 0
  const first = timestamps[0]

  if (!first || currentTime < first.s) return 0

  // After last word — snap to last
  const last = timestamps[timestamps.length - 1]

  if (!last || currentTime >= last.e) return timestamps.length - 1

  // Binary search for the word containing currentTime (with lookahead)
  let low = 0
  let high = timestamps.length - 1

  while (low <= high) {
    const mid = (low + high) >>> 1
    const word = timestamps[mid]

    if (!word) break

    if (currentTime + LOOKAHEAD_MS < word.s) {
      high = mid - 1
    } else if (currentTime >= word.e) {
      low = mid + 1
    } else {
      return mid
    }
  }

  // In a gap between words — return the previous word
  return Math.max(0, high)
}
