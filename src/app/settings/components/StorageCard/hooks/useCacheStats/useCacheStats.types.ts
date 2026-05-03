export interface BookCacheStat {
  bookId: string
  title: string
  voice: string
  voiceDisplayName: string
  usedBytes: number
  entryCount: number
}

export interface CacheStatsResponse {
  usedBytes: number
  maxBytes: number
  diskTotalBytes: number | null
  diskAvailableBytes: number | null
  books: BookCacheStat[]
}
