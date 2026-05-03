/**
 * API response types
 */

export interface TTSResponse {
  audio: ArrayBuffer
  cached: boolean
  generationTimeMs?: number
}

export interface CacheStats {
  usedBytes: number
  maxBytes: number
}

export interface BookCacheStats {
  bookId: string
  usedBytes: number
  entryCount: number
}

export interface VoiceInfo {
  name: string
  hasSource: boolean
  hasSample: boolean
}

export interface ErrorResponse {
  error: string
}
