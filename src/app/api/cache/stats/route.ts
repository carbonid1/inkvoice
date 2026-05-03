import { NextResponse } from 'next/server'
import { env } from '@/lib/config/env'
import { getBookService } from '@/lib/services/book/book.service'
import { getCacheService } from '@/lib/services/cache/cache.service'
import { diskSpaceService } from '@/lib/services/platform/diskSpace'
import { voiceService } from '@/lib/services/voice/voice.service'

export const GET = async () => {
  try {
    const cacheService = getCacheService()

    const [stats, bookStats, diskInfo] = await Promise.all([
      cacheService.getStats(),
      cacheService.getBookStats(),
      diskSpaceService.getAvailableSpace(env.cacheDir).catch(() => null),
    ])

    const trackedStats = bookStats.filter(s => s.bookId !== 'unknown')

    // Only fetch metadata for unique books/voices that actually have cache entries
    const bookService = getBookService()
    const uniqueBookIds = [...new Set(trackedStats.map(s => s.bookId))]
    const uniqueVoiceNames = [...new Set(trackedStats.map(s => s.voice))]

    const [bookMetas, voiceDisplayNames] = await Promise.all([
      Promise.all(
        uniqueBookIds.map(async id => {
          const meta = await bookService.getMetadata(id)

          return [id, meta?.title ?? 'Unknown Book'] as const
        }),
      ),
      Promise.all(
        uniqueVoiceNames.map(
          async name => [name, await voiceService.getDisplayName(name)] as const,
        ),
      ),
    ])

    const bookTitles = new Map(bookMetas)
    const voiceLabels = new Map(voiceDisplayNames)

    return NextResponse.json({
      usedBytes: stats.usedBytes,
      maxBytes: stats.maxBytes,
      diskTotalBytes: diskInfo?.total ?? null,
      diskAvailableBytes: diskInfo?.available ?? null,
      books: trackedStats
        .map(s => ({
          bookId: s.bookId,
          title: bookTitles.get(s.bookId) ?? 'Unknown Book',
          voice: s.voice,
          voiceDisplayName: voiceLabels.get(s.voice) ?? s.voice,
          usedBytes: s.usedBytes,
          entryCount: s.entryCount,
        }))
        // Cluster rows of the same book together (title asc), with the heavier
        // voice first inside each book.
        .sort((a, b) => a.title.localeCompare(b.title) || b.usedBytes - a.usedBytes),
    })
  } catch (error) {
    console.error('Failed to get cache stats:', error)
    return NextResponse.json({ error: 'Failed to get cache stats' }, { status: 500 })
  }
}
