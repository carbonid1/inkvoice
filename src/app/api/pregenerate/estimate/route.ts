import { NextResponse } from 'next/server'
import { getCacheService } from '@/lib/services/cache/cache.service'
import { checkBudget } from '@/lib/services/cache/helpers/checkBudget/checkBudget'
import { prisma } from '@/lib/services/db/db.service'
import { computePregenEstimate } from '@/lib/services/pregeneration/helpers/computePregenEstimate/computePregenEstimate'
import { voicePreferenceService } from '@/lib/services/voice-preference/voice-preference.service'

interface BulkEstimateEntry {
  totalParagraphs: number
  cachedParagraphs: number
  estimatedSizeBytes: number
  estimatedGenerationMinutes: number
  budget: ReturnType<typeof checkBudget>
}

export const GET = async () => {
  const cacheService = getCacheService()
  const [books, voicePrefs, cacheStats, voiceCounts] = await Promise.all([
    prisma.book.findMany({
      where: { deletedAt: null },
      select: { id: true, totalParagraphs: true, totalWords: true, unspeakableParagraphs: true },
    }),
    voicePreferenceService.getAll(),
    cacheService.getStats(),
    cacheService.countAllBookVoiceEntries(),
  ])

  const result: Record<string, BulkEstimateEntry> = {}

  for (const book of books) {
    if (book.totalParagraphs == null || book.totalWords == null) continue

    const voice = voicePrefs.bookVoices[book.id] ?? voicePrefs.voice
    const cachedParagraphs = voiceCounts.get(`${book.id}|${voice}`) ?? 0
    // Unspeakable separators never get cache entries; a null count means the
    // stats row predates the column and refreshes on next per-book access.
    const speakableParagraphs = book.totalParagraphs - (book.unspeakableParagraphs ?? 0)

    const { estimatedSizeBytes, estimatedGenerationMinutes } = computePregenEstimate({
      totalParagraphs: speakableParagraphs,
      totalWords: book.totalWords,
      cachedParagraphs,
    })

    const budget = checkBudget({
      usedBytes: cacheStats.usedBytes,
      maxBytes: cacheStats.maxBytes,
      estimatedBytes: estimatedSizeBytes,
    })

    result[book.id] = {
      totalParagraphs: speakableParagraphs,
      cachedParagraphs,
      estimatedSizeBytes,
      estimatedGenerationMinutes,
      budget,
    }
  }

  return NextResponse.json(result)
}
