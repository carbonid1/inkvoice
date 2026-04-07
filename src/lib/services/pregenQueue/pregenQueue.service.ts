import { prisma } from '@/lib/services/db/db.service'

import type { PregenJob } from './pregenQueue.types'
import { PREGEN_JOB_STATUS } from './pregenQueue.types'

const enqueue = async (
  bookId: string,
  voice: string,
  totalParagraphs: number,
  startChapter = 0,
): Promise<PregenJob> => {
  const now = Date.now()
  const row = await prisma.pregenJob.create({
    data: {
      bookId,
      voice,
      totalParagraphs,
      currentChapter: startChapter,
      createdAt: now,
      updatedAt: now,
    },
  })
  return row as PregenJob
}

const getNext = async (): Promise<PregenJob | null> => {
  const row = await prisma.pregenJob.findFirst({
    where: { status: PREGEN_JOB_STATUS.QUEUED },
    orderBy: { createdAt: 'asc' },
  })
  return (row as PregenJob) ?? null
}

const getJob = async (id: string): Promise<PregenJob | null> => {
  const row = await prisma.pregenJob.findUnique({
    where: { id },
  })
  return (row as PregenJob) ?? null
}

const getByBookId = async (bookId: string): Promise<PregenJob | null> => {
  const row = await prisma.pregenJob.findFirst({
    where: {
      bookId,
      status: {
        in: [PREGEN_JOB_STATUS.QUEUED, PREGEN_JOB_STATUS.IN_PROGRESS, PREGEN_JOB_STATUS.PAUSED],
      },
    },
  })
  return (row as PregenJob) ?? null
}

const getAnyByBookId = async (bookId: string): Promise<PregenJob | null> => {
  const row = await prisma.pregenJob.findFirst({
    where: { bookId },
    orderBy: { createdAt: 'desc' },
  })
  return (row as PregenJob) ?? null
}

const getAll = async (): Promise<PregenJob[]> => {
  const rows = await prisma.pregenJob.findMany({
    orderBy: { createdAt: 'asc' },
  })
  return rows as PregenJob[]
}

const start = async (id: string): Promise<PregenJob> => {
  const row = await prisma.pregenJob.update({
    where: { id },
    data: { status: PREGEN_JOB_STATUS.IN_PROGRESS, updatedAt: Date.now() },
  })
  return row as PregenJob
}

const updateProgress = async (
  id: string,
  chapter: number,
  paragraph: number,
  completedParagraphs: number,
  generatedDurationMs?: number,
): Promise<PregenJob> => {
  const row = await prisma.pregenJob.update({
    where: { id },
    data: {
      currentChapter: chapter,
      currentParagraph: paragraph,
      completedParagraphs,
      ...(generatedDurationMs !== undefined && { generatedDurationMs }),
      updatedAt: Date.now(),
    },
  })
  return row as PregenJob
}

const pause = async (id: string, errorMessage?: string): Promise<PregenJob> => {
  const row = await prisma.pregenJob.update({
    where: { id },
    data: {
      status: PREGEN_JOB_STATUS.PAUSED,
      errorMessage: errorMessage ?? null,
      updatedAt: Date.now(),
    },
  })
  return row as PregenJob
}

const resume = async (id: string): Promise<PregenJob> => {
  const row = await prisma.pregenJob.update({
    where: { id },
    data: {
      status: PREGEN_JOB_STATUS.QUEUED,
      errorMessage: null,
      updatedAt: Date.now(),
    },
  })
  return row as PregenJob
}

const complete = async (id: string): Promise<PregenJob> => {
  const row = await prisma.pregenJob.update({
    where: { id },
    data: { status: PREGEN_JOB_STATUS.COMPLETED, updatedAt: Date.now() },
  })
  return row as PregenJob
}

const cancel = async (id: string): Promise<void> => {
  await prisma.pregenJob.delete({
    where: { id },
  })
}

export const pregenQueueService = {
  enqueue,
  getNext,
  getJob,
  getByBookId,
  getAnyByBookId,
  getAll,
  start,
  updateProgress,
  pause,
  resume,
  complete,
  cancel,
}
