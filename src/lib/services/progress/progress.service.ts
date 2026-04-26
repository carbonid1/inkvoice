import { z } from 'zod'
import { prisma } from '../db/db.service'
import type { Progress } from './progress.types'

const numberArraySchema = z.array(z.number())
const chapterPositionsSchema = z.record(z.string(), z.number())

const parseField = <T>(json: string, schema: z.ZodType<T>, context: string): T | undefined => {
  const parsed = schema.safeParse(JSON.parse(json))

  if (!parsed.success) {
    console.warn(`[progress] Invalid ${context}: ${parsed.error.message}`)
    return undefined
  }
  return parsed.data
}

const getAll = async (): Promise<Record<string, Progress>> => {
  const rows = await prisma.readingProgress.findMany()
  const result: Record<string, Progress> = {}

  for (const row of rows) {
    result[row.bookId] = toProgress(row)
  }
  return result
}

interface ProgressRow {
  bookId: string
  chapter: number
  paragraph: number
  paragraphsPerChapter: string | null
  wordsPerChapter: string | null
  lastReadAt: number | null
  finishedAt: number | null
  chapterPositions: string | null
}

const toProgress = (row: ProgressRow): Progress => {
  const paragraphsPerChapter =
    row.paragraphsPerChapter !== null
      ? parseField(row.paragraphsPerChapter, numberArraySchema, 'paragraphsPerChapter')
      : undefined
  const wordsPerChapter =
    row.wordsPerChapter !== null
      ? parseField(row.wordsPerChapter, numberArraySchema, 'wordsPerChapter')
      : undefined
  const chapterPositions =
    row.chapterPositions !== null
      ? parseField(row.chapterPositions, chapterPositionsSchema, 'chapterPositions')
      : undefined

  return {
    chapter: row.chapter,
    paragraph: row.paragraph,
    ...(paragraphsPerChapter && { paragraphsPerChapter }),
    ...(wordsPerChapter && { wordsPerChapter }),
    ...(row.lastReadAt !== null && { lastReadAt: row.lastReadAt }),
    ...(row.finishedAt !== null && { finishedAt: row.finishedAt }),
    ...(chapterPositions && { chapterPositions }),
  }
}

const get = async (bookId: string): Promise<Progress | null> => {
  const row = await prisma.readingProgress.findUnique({ where: { bookId } })

  if (!row) return null
  return toProgress(row)
}

const upsert = async (bookId: string, data: Progress): Promise<void> => {
  const serialized = {
    chapter: data.chapter,
    paragraph: data.paragraph,
    paragraphsPerChapter: data.paragraphsPerChapter
      ? JSON.stringify(data.paragraphsPerChapter)
      : null,
    wordsPerChapter: data.wordsPerChapter ? JSON.stringify(data.wordsPerChapter) : null,
    lastReadAt: data.lastReadAt ?? null,
    finishedAt: data.finishedAt ?? null,
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
