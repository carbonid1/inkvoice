import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PregenJob } from './pregenQueue.types'
import { PREGEN_JOB_STATUS } from './pregenQueue.types'

const mockPrisma = vi.hoisted(() => ({
  pregenJob: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../db/db.service', () => ({ prisma: mockPrisma }))

import { Prisma } from '../../../../generated/prisma'
import { pregenQueueService } from './pregenQueue.service'

const recordNotFound = (): Prisma.PrismaClientKnownRequestError =>
  new Prisma.PrismaClientKnownRequestError('Record not found', {
    code: 'P2025',
    clientVersion: 'test',
  })

describe('pregenQueueService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('enqueue', () => {
    it('creates a job with status queued', async () => {
      const now = 1700000000000
      vi.spyOn(Date, 'now').mockReturnValue(now)

      const row: PregenJob = {
        id: 'test-uuid',
        bookId: 'book-1',
        voice: 'narrator',
        status: 'queued',
        totalParagraphs: 500,
        completedParagraphs: 0,
        generatedDurationMs: 0,
        currentChapter: 0,
        currentParagraph: 0,
        errorMessage: null,
        createdAt: now,
        updatedAt: now,
      }
      mockPrisma.pregenJob.create.mockResolvedValue(row)

      const result = await pregenQueueService.enqueue('book-1', 'narrator', 500)

      expect(mockPrisma.pregenJob.create).toHaveBeenCalledWith({
        data: {
          bookId: 'book-1',
          voice: 'narrator',
          totalParagraphs: 500,
          currentChapter: 0,
          createdAt: now,
          updatedAt: now,
        },
      })
      expect(result).toEqual<PregenJob>(row)
    })
  })

  describe('getNext', () => {
    it('returns oldest queued job (FIFO)', async () => {
      const older = { id: 'older', status: 'queued', createdAt: 1000 }
      mockPrisma.pregenJob.findFirst.mockResolvedValue(older)

      const result = await pregenQueueService.getNext()

      expect(mockPrisma.pregenJob.findFirst).toHaveBeenCalledWith({
        where: { status: PREGEN_JOB_STATUS.QUEUED },
        orderBy: { createdAt: 'asc' },
      })
      expect(result).toEqual(older)
    })

    it('returns null when no queued jobs', async () => {
      mockPrisma.pregenJob.findFirst.mockResolvedValue(null)

      const result = await pregenQueueService.getNext()

      expect(result).toBeNull()
    })
  })

  describe('getByBookId', () => {
    it('returns active job for a book', async () => {
      const job = { id: 'job-1', bookId: 'book-1', status: 'in_progress' }
      mockPrisma.pregenJob.findFirst.mockResolvedValue(job)

      const result = await pregenQueueService.getByBookId('book-1')

      expect(mockPrisma.pregenJob.findFirst).toHaveBeenCalledWith({
        where: {
          bookId: 'book-1',
          status: {
            in: [PREGEN_JOB_STATUS.QUEUED, PREGEN_JOB_STATUS.IN_PROGRESS, PREGEN_JOB_STATUS.PAUSED],
          },
        },
      })
      expect(result).toEqual(job)
    })
  })

  describe('start', () => {
    it('transitions to in_progress', async () => {
      const now = 1700000000000
      vi.spyOn(Date, 'now').mockReturnValue(now)
      mockPrisma.pregenJob.update.mockResolvedValue({})

      await pregenQueueService.start('job-1')

      expect(mockPrisma.pregenJob.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: { status: PREGEN_JOB_STATUS.IN_PROGRESS, updatedAt: now },
      })
    })

    it('returns null when the job row was deleted (P2025)', async () => {
      mockPrisma.pregenJob.update.mockRejectedValue(recordNotFound())

      const result = await pregenQueueService.start('job-1')

      expect(result).toBeNull()
    })

    it('rethrows non-P2025 Prisma errors', async () => {
      const error = new Error('database is locked')
      mockPrisma.pregenJob.update.mockRejectedValue(error)

      await expect(pregenQueueService.start('job-1')).rejects.toThrow('database is locked')
    })
  })

  describe('updateProgress', () => {
    it('updates chapter, paragraph, and completed count', async () => {
      const now = 1700000000000
      vi.spyOn(Date, 'now').mockReturnValue(now)
      mockPrisma.pregenJob.update.mockResolvedValue({})

      await pregenQueueService.updateProgress('job-1', 5, 12, 150)

      expect(mockPrisma.pregenJob.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: {
          currentChapter: 5,
          currentParagraph: 12,
          completedParagraphs: 150,
          updatedAt: now,
        },
      })
    })

    it('returns null when the job row was deleted (P2025)', async () => {
      mockPrisma.pregenJob.update.mockRejectedValue(recordNotFound())

      const result = await pregenQueueService.updateProgress('job-1', 0, 0, 0)

      expect(result).toBeNull()
    })
  })

  describe('pause', () => {
    it('transitions to paused with error message', async () => {
      const now = 1700000000000
      vi.spyOn(Date, 'now').mockReturnValue(now)
      mockPrisma.pregenJob.update.mockResolvedValue({})

      await pregenQueueService.pause('job-1', 'TTS error at chapter 12')

      expect(mockPrisma.pregenJob.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: {
          status: PREGEN_JOB_STATUS.PAUSED,
          errorMessage: 'TTS error at chapter 12',
          updatedAt: now,
        },
      })
    })

    it('returns null when the job row was deleted (P2025)', async () => {
      mockPrisma.pregenJob.update.mockRejectedValue(recordNotFound())

      const result = await pregenQueueService.pause('job-1')

      expect(result).toBeNull()
    })
  })

  describe('resume', () => {
    it('transitions paused to queued', async () => {
      const now = 1700000000000
      vi.spyOn(Date, 'now').mockReturnValue(now)
      mockPrisma.pregenJob.update.mockResolvedValue({})

      await pregenQueueService.resume('job-1')

      expect(mockPrisma.pregenJob.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: {
          status: PREGEN_JOB_STATUS.QUEUED,
          errorMessage: null,
          updatedAt: now,
        },
      })
    })

    it('returns null when the job row was deleted (P2025)', async () => {
      mockPrisma.pregenJob.update.mockRejectedValue(recordNotFound())

      const result = await pregenQueueService.resume('job-1')

      expect(result).toBeNull()
    })
  })

  describe('complete', () => {
    it('transitions to completed', async () => {
      const now = 1700000000000
      vi.spyOn(Date, 'now').mockReturnValue(now)
      mockPrisma.pregenJob.update.mockResolvedValue({})

      await pregenQueueService.complete('job-1')

      expect(mockPrisma.pregenJob.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: { status: PREGEN_JOB_STATUS.COMPLETED, updatedAt: now },
      })
    })

    it('returns null when the job row was deleted (P2025)', async () => {
      mockPrisma.pregenJob.update.mockRejectedValue(recordNotFound())

      const result = await pregenQueueService.complete('job-1')

      expect(result).toBeNull()
    })
  })

  describe('cancel', () => {
    it('deletes the job and reports deleted: true', async () => {
      mockPrisma.pregenJob.delete.mockResolvedValue({})

      const result = await pregenQueueService.cancel('job-1')

      expect(mockPrisma.pregenJob.delete).toHaveBeenCalledWith({
        where: { id: 'job-1' },
      })
      expect(result).toEqual({ deleted: true })
    })

    it('reports deleted: false when the row was already gone (P2025)', async () => {
      mockPrisma.pregenJob.delete.mockRejectedValue(recordNotFound())

      const result = await pregenQueueService.cancel('job-1')

      expect(result).toEqual({ deleted: false })
    })

    it('rethrows non-P2025 errors', async () => {
      mockPrisma.pregenJob.delete.mockRejectedValue(new Error('database is locked'))

      await expect(pregenQueueService.cancel('job-1')).rejects.toThrow('database is locked')
    })
  })

  describe('getAll', () => {
    it('returns all jobs ordered by creation time', async () => {
      const jobs = [{ id: '1' }, { id: '2' }]
      mockPrisma.pregenJob.findMany.mockResolvedValue(jobs)

      const result = await pregenQueueService.getAll()

      expect(mockPrisma.pregenJob.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'asc' },
      })
      expect(result).toEqual(jobs)
    })
  })

  describe('getJob', () => {
    it('returns a job by id', async () => {
      const job = { id: 'job-1' }
      mockPrisma.pregenJob.findUnique.mockResolvedValue(job)

      const result = await pregenQueueService.getJob('job-1')

      expect(mockPrisma.pregenJob.findUnique).toHaveBeenCalledWith({
        where: { id: 'job-1' },
      })
      expect(result).toEqual(job)
    })
  })
})
