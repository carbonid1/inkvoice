import { type NextRequest, NextResponse } from 'next/server'
import { getBookService } from '@/lib/services/book/book.service'
import { getCacheService } from '@/lib/services/cache/cache.service'
import { checkBudget } from '@/lib/services/cache/helpers/checkBudget/checkBudget'
import { computePregenEstimate } from '@/lib/services/pregeneration/helpers/computePregenEstimate/computePregenEstimate'
import { voicePreferenceService } from '@/lib/services/voice-preference/voice-preference.service'

interface RouteParams {
  params: Promise<{ bookId: string }>
}

export const GET = async (_request: NextRequest, { params }: RouteParams) => {
  const { bookId } = await params

  const bookService = getBookService()
  const [bookStats, voicePrefs] = await Promise.all([
    bookService.getBookStats(bookId),
    voicePreferenceService.getAll(),
  ])

  if (!bookStats) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }

  const { totalParagraphs, totalWords } = bookStats

  const voice = voicePrefs.bookVoices[bookId] ?? voicePrefs.voice
  const cacheService = getCacheService()
  const [cachedParagraphs, stats] = await Promise.all([
    cacheService.countBookVoiceEntries(bookId, voice),
    cacheService.getStats(),
  ])

  const { estimatedSizeBytes, estimatedGenerationMinutes } = computePregenEstimate({
    totalParagraphs,
    totalWords,
    cachedParagraphs,
  })

  const budget = checkBudget({
    usedBytes: stats.usedBytes,
    maxBytes: stats.maxBytes,
    estimatedBytes: estimatedSizeBytes,
  })

  return NextResponse.json({
    totalParagraphs,
    cachedParagraphs,
    estimatedSizeBytes,
    estimatedGenerationMinutes,
    budget,
  })
}
