import type { CacheStats } from '@/lib/types/api'

export interface CacheService {
  /** Get cached audio for a text/voice combination */
  get(text: string, voice: string): Promise<Buffer | null>

  /** Store audio in cache */
  set(text: string, voice: string, audio: Buffer, bookId?: string): Promise<void>

  /** Get cache statistics */
  getStats(): Promise<CacheStats>

  /** Delete a single cached entry */
  delete(text: string, voice: string): Promise<boolean>

  /** Clear all cached data */
  clear(): Promise<void>
}
