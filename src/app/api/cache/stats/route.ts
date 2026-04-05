import { env } from '@/lib/config/env'
import { getBookService } from '@/lib/services/book/book.service'
import { getCacheService } from '@/lib/services/cache/cache.service'
import { diskSpaceService } from '@/lib/services/platform/diskSpace'
import { NextResponse } from 'next/server'

export const GET = async () => {
  try {
    const cacheService = getCacheService()

    const [stats, bookStats, diskInfo] = await Promise.all([
      cacheService.getStats(),
      cacheService.getBookStats(),
      diskSpaceService.getAvailableSpace(env.cacheDir).catch(() => null),
    ])

    const cachedBookIds = bookStats.filter(s => s.bookId !== 'unknown').map(s => s.bookId)

    // Only fetch metadata for books with cache entries (avoids full filesystem scan)
    const bookService = getBookService()
    const metadataResults = await Promise.all(
      cachedBookIds.map(async id => {
        const meta = await bookService.getMetadata(id)
        return { id, title: meta?.title ?? 'Unknown Book' }
      }),
    )
    const bookTitles = new Map(metadataResults.map(b => [b.id, b.title]))

    return NextResponse.json({
      usedBytes: stats.usedBytes,
      maxBytes: stats.maxBytes,
      diskTotalBytes: diskInfo?.total ?? null,
      diskAvailableBytes: diskInfo?.available ?? null,
      books: bookStats
        .filter(s => s.bookId !== 'unknown')
        .map(s => ({
          bookId: s.bookId,
          title: bookTitles.get(s.bookId) ?? 'Unknown Book',
          usedBytes: s.usedBytes,
          entryCount: s.entryCount,
        }))
        .sort((a, b) => b.usedBytes - a.usedBytes),
    })
  } catch (error) {
    console.error('Failed to get cache stats:', error)
    return NextResponse.json({ error: 'Failed to get cache stats' }, { status: 500 })
  }
}
