export type BookCacheStat = {
  bookId: string
  title: string
  usedBytes: number
  entryCount: number
}

export type CacheStatsResponse = {
  usedBytes: number
  maxBytes: number
  diskTotalBytes: number | null
  diskAvailableBytes: number | null
  books: BookCacheStat[]
}
