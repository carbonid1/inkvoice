import { prisma } from '../db/db.service'
import type { Progress } from './progress.types'

const getAll = async (): Promise<Record<string, Progress>> => {
  const rows = await prisma.readingProgress.findMany()
  const result: Record<string, Progress> = {}
  for (const row of rows) {
    result[row.bookId] = toProgress(row)
  }
  return result
}

type ProgressRow = {
  bookId: string
  chapter: number
  sentence: number
  totalChapters: number | null
  sentencesPerChapter: string | null
  wordsPerChapter: string | null
  lastReadAt: number | null
  chapterPositions: string | null
}

const toProgress = (row: ProgressRow): Progress => ({
  chapter: row.chapter,
  sentence: row.sentence,
  ...(row.totalChapters !== null && { totalChapters: row.totalChapters }),
  ...(row.sentencesPerChapter !== null && {
    sentencesPerChapter: JSON.parse(row.sentencesPerChapter) as number[],
  }),
  ...(row.wordsPerChapter !== null && {
    wordsPerChapter: JSON.parse(row.wordsPerChapter) as number[],
  }),
  ...(row.lastReadAt !== null && { lastReadAt: row.lastReadAt }),
  ...(row.chapterPositions !== null && {
    chapterPositions: JSON.parse(row.chapterPositions) as Record<number, number>,
  }),
})

const get = async (bookId: string): Promise<Progress | null> => {
  const row = await prisma.readingProgress.findUnique({ where: { bookId } })
  if (!row) return null
  return toProgress(row)
}

const upsert = async (bookId: string, data: Progress): Promise<void> => {
  const serialized = {
    chapter: data.chapter,
    sentence: data.sentence,
    totalChapters: data.totalChapters ?? null,
    sentencesPerChapter: data.sentencesPerChapter ? JSON.stringify(data.sentencesPerChapter) : null,
    wordsPerChapter: data.wordsPerChapter ? JSON.stringify(data.wordsPerChapter) : null,
    lastReadAt: data.lastReadAt ?? null,
    chapterPositions: data.chapterPositions ? JSON.stringify(data.chapterPositions) : null,
  }

  await prisma.readingProgress.upsert({
    where: { bookId },
    create: { bookId, ...serialized },
    update: serialized,
  })
}

const remove = async (bookId: string): Promise<boolean> => {
  const result = await prisma.readingProgress.deleteMany({ where: { bookId } })
  return result.count > 0
}

export const progressService = {
  getAll,
  get,
  upsert,
  remove,
}
