import { describe, expect, it, vi } from 'vitest'

const mockPrisma = vi.hoisted(() => ({
  readingProgress: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    upsert: vi.fn().mockResolvedValue({}),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  },
}))

vi.mock('../db/db.service', () => ({
  prisma: mockPrisma,
}))

import { progressService } from './progress.service'

describe('progressService', () => {
  it('returns empty record when no progress exists', async () => {
    mockPrisma.readingProgress.findMany.mockResolvedValue([])
    const result = await progressService.getAll()

    expect(result).toEqual({})
  })

  it('returns all progress keyed by bookId with deserialized fields', async () => {
    mockPrisma.readingProgress.findMany.mockResolvedValue([
      {
        bookId: 'book-1',
        chapter: 3,
        paragraph: 7,
        paragraphsPerChapter: '[5,3,8]',
        wordsPerChapter: '[50,30,80]',
        lastReadAt: 1000,
        chapterPositions: '{"0":2,"1":4}',
      },
      {
        bookId: 'book-2',
        chapter: 0,
        paragraph: 0,
        paragraphsPerChapter: null,
        wordsPerChapter: null,
        lastReadAt: null,
        chapterPositions: null,
      },
    ])

    const result = await progressService.getAll()

    expect(result).toEqual({
      'book-1': {
        chapter: 3,
        paragraph: 7,
        paragraphsPerChapter: [5, 3, 8],
        wordsPerChapter: [50, 30, 80],
        lastReadAt: 1000,
        chapterPositions: { 0: 2, 1: 4 },
      },
      'book-2': {
        chapter: 0,
        paragraph: 0,
      },
    })
  })

  it('returns null for unknown book', async () => {
    mockPrisma.readingProgress.findUnique.mockResolvedValue(null)
    const result = await progressService.get('unknown')

    expect(result).toBeNull()
    expect(mockPrisma.readingProgress.findUnique).toHaveBeenCalledWith({
      where: { bookId: 'unknown' },
    })
  })

  it('returns progress for a known book', async () => {
    mockPrisma.readingProgress.findUnique.mockResolvedValue({
      bookId: 'book-1',
      chapter: 2,
      paragraph: 5,
      paragraphsPerChapter: '[10,20]',
      wordsPerChapter: null,
      lastReadAt: 2000,
      chapterPositions: null,
    })

    const result = await progressService.get('book-1')

    expect(result).toEqual({
      chapter: 2,
      paragraph: 5,
      paragraphsPerChapter: [10, 20],
      lastReadAt: 2000,
    })
  })

  it('upserts progress with serialized JSON fields', async () => {
    await progressService.upsert('book-1', {
      chapter: 1,
      paragraph: 3,
      paragraphsPerChapter: [10, 20, 30],
      wordsPerChapter: [100, 200, 300],
      lastReadAt: 3000,
      chapterPositions: { 0: 5, 1: 3 },
    })

    expect(mockPrisma.readingProgress.upsert).toHaveBeenCalledWith({
      where: { bookId: 'book-1' },
      create: {
        bookId: 'book-1',
        chapter: 1,
        paragraph: 3,
        paragraphsPerChapter: '[10,20,30]',
        wordsPerChapter: '[100,200,300]',
        lastReadAt: 3000,
        finishedAt: null,
        chapterPositions: '{"0":5,"1":3}',
      },
      update: {
        chapter: 1,
        paragraph: 3,
        paragraphsPerChapter: '[10,20,30]',
        wordsPerChapter: '[100,200,300]',
        lastReadAt: 3000,
        finishedAt: null,
        chapterPositions: '{"0":5,"1":3}',
      },
    })
  })

  it('removes progress and returns true when found', async () => {
    mockPrisma.readingProgress.deleteMany.mockResolvedValue({ count: 1 })
    const result = await progressService.remove('book-1')

    expect(result).toBe(true)
    expect(mockPrisma.readingProgress.deleteMany).toHaveBeenCalledWith({
      where: { bookId: 'book-1' },
    })
  })

  it('returns false when removing non-existent progress', async () => {
    mockPrisma.readingProgress.deleteMany.mockResolvedValue({ count: 0 })
    const result = await progressService.remove('unknown')

    expect(result).toBe(false)
  })
})
