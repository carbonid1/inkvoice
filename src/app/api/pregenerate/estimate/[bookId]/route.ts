import { getBookService } from '@/lib/services/book/book.service'
import { getCacheService } from '@/lib/services/cache/cache.service'
import { voicePreferenceService } from '@/lib/services/voice-preference/voice-preference.service'
import { NextRequest, NextResponse } from 'next/server'

type RouteParams = { params: Promise<{ bookId: string }> }

const WORDS_PER_MINUTE = 150
const OPUS_MB_PER_HOUR = 17
const AVG_SECONDS_PER_PARAGRAPH = 8

export const GET = async (_request: NextRequest, { params }: RouteParams) => {
  const { bookId } = await params

  const bookService = getBookService()
  const [overview, voicePrefs] = await Promise.all([
    bookService.getBookOverview(bookId),
    voicePreferenceService.getAll(),
  ])

  if (!overview) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }

  const totalParagraphs = overview.chapters.reduce((sum, ch) => sum + ch.paragraphCount, 0)
  const totalWords = overview.chapters.reduce((sum, ch) => sum + ch.wordCount, 0)

  const voice = voicePrefs.bookVoices[bookId] ?? voicePrefs.voice
  const cacheService = getCacheService()
  const cachedParagraphs = await cacheService.countBookVoiceEntries(bookId, voice)
  const remainingParagraphs = Math.max(0, totalParagraphs - cachedParagraphs)

  const wordsPerParagraph = totalParagraphs > 0 ? totalWords / totalParagraphs : 0
  const remainingWords = remainingParagraphs * wordsPerParagraph
  const remainingHours = remainingWords / (WORDS_PER_MINUTE * 60)
  const estimatedSizeBytes = Math.round(remainingHours * OPUS_MB_PER_HOUR * 1024 * 1024)
  const estimatedGenerationMinutes = Math.round(
    (remainingParagraphs * AVG_SECONDS_PER_PARAGRAPH) / 60,
  )

  return NextResponse.json({
    totalParagraphs,
    cachedParagraphs,
    estimatedSizeBytes,
    estimatedGenerationMinutes,
  })
}
