import type { CacheStats } from '@/lib/types/api'
import type { WordTimestamp } from '@/lib/types/wordTimestamp'

export interface CacheService {
  /** Get cached audio for a text/voice combination */
  get(text: string, voice: string): Promise<Buffer | null>

  /** Store audio in cache */
  set(text: string, voice: string, audio: Buffer, bookId?: string): Promise<void>

  /** Get cache statistics */
  getStats(): Promise<CacheStats>

  /** Get cached word timestamps for a text/voice combination */
  getTimestamps(text: string, voice: string): Promise<WordTimestamp[] | null>

  /** Store word timestamps sidecar */
  setTimestamps(text: string, voice: string, timestamps: WordTimestamp[]): Promise<void>

  /** Delete a single cached entry */
  delete(text: string, voice: string): Promise<boolean>

  /** Clear all cached data */
  clear(): Promise<void>
}
