import type { CacheStats } from '@/lib/types/api'

export interface CacheService {
  /** Get cached audio for a text/voice combination */
  get(text: string, voice: string): Promise<Buffer | null>

  /** Store audio in cache */
  set(text: string, voice: string, audio: Buffer): Promise<void>

  /** Get cache statistics */
  getStats(): Promise<CacheStats>

  /** Clear all cached data */
  clear(): Promise<void>
}
