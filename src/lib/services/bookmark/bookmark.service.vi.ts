import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockPrisma = vi.hoisted(() => ({
  bookmark: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
}))

vi.mock('../db/db.service', () => ({
  prisma: mockPrisma,
}))

import { bookmarkService } from './bookmark.service'

describe('bookmarkService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns empty array for unknown book', async () => {
    mockPrisma.bookmark.findMany.mockResolvedValue([])
    const bookmarks = await bookmarkService.getBookmarks('unknown-book')
    expect(bookmarks).toEqual([])
    expect(mockPrisma.bookmark.findMany).toHaveBeenCalledWith({
      where: { bookId: 'unknown-book' },
      orderBy: { createdAt: 'asc' },
    })
  })

  it('adds a bookmark and returns it', async () => {
    mockPrisma.bookmark.findFirst.mockResolvedValue(null)
    mockPrisma.bookmark.create.mockResolvedValue({
      id: 'uuid-1',
      bookId: 'book-1',
      chapter: 2,
      sentence: 5,
      createdAt: 1000,
      label: null,
      preview: null,
    })

    const bookmark = await bookmarkService.addBookmark('book-1', 2, 5)
    expect(bookmark).toMatchObject({ chapter: 2, sentence: 5 })
    expect(bookmark.id).toBe('uuid-1')
    expect(bookmark.createdAt).toBe(1000)
  })

  it('returns existing bookmark on duplicate add', async () => {
    const existing = {
      id: 'uuid-1',
      bookId: 'book-1',
      chapter: 3,
      sentence: 7,
      createdAt: 1000,
      label: null,
      preview: null,
    }
    mockPrisma.bookmark.findFirst.mockResolvedValue(existing)

    const result = await bookmarkService.addBookmark('book-1', 3, 7)
    expect(result.id).toBe('uuid-1')
    expect(mockPrisma.bookmark.create).not.toHaveBeenCalled()
  })

  it('removes a bookmark and returns true', async () => {
    mockPrisma.bookmark.findFirst.mockResolvedValue({
      id: 'uuid-1',
      bookId: 'book-1',
    })
    mockPrisma.bookmark.delete.mockResolvedValue({})

    const removed = await bookmarkService.removeBookmark('book-1', 'uuid-1')
    expect(removed).toBe(true)
    expect(mockPrisma.bookmark.delete).toHaveBeenCalledWith({ where: { id: 'uuid-1' } })
  })

  it('returns false when removing non-existent bookmark', async () => {
    mockPrisma.bookmark.findFirst.mockResolvedValue(null)
    const removed = await bookmarkService.removeBookmark('book-1', 'no-such-id')
    expect(removed).toBe(false)
    expect(mockPrisma.bookmark.delete).not.toHaveBeenCalled()
  })

  it('stores preview text on bookmark', async () => {
    mockPrisma.bookmark.findFirst.mockResolvedValue(null)
    mockPrisma.bookmark.create.mockResolvedValue({
      id: 'uuid-1',
      bookId: 'book-1',
      chapter: 1,
      sentence: 0,
      createdAt: 1000,
      label: null,
      preview: 'The quick brown fox',
    })

    const bookmark = await bookmarkService.addBookmark('book-1', 1, 0, 'The quick brown fox')
    expect(bookmark.preview).toBe('The quick brown fox')
    expect(mockPrisma.bookmark.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ preview: 'The quick brown fox' }),
      }),
    )
  })

  it('truncates preview to 120 characters', async () => {
    mockPrisma.bookmark.findFirst.mockResolvedValue(null)
    const longText = 'A'.repeat(200)
    mockPrisma.bookmark.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'uuid-1',
        bookId: 'book-1',
        ...data,
        label: null,
      }),
    )

    const bookmark = await bookmarkService.addBookmark('book-1', 0, 0, longText)
    expect(bookmark.preview).toHaveLength(120)
  })

  it('omits preview when not provided', async () => {
    mockPrisma.bookmark.findFirst.mockResolvedValue(null)
    mockPrisma.bookmark.create.mockResolvedValue({
      id: 'uuid-1',
      bookId: 'book-1',
      chapter: 0,
      sentence: 0,
      createdAt: 1000,
      label: null,
      preview: null,
    })

    const bookmark = await bookmarkService.addBookmark('book-1', 0, 0)
    expect(bookmark.preview).toBeUndefined()
  })

  it('removes all bookmarks for a book', async () => {
    mockPrisma.bookmark.deleteMany.mockResolvedValue({ count: 3 })
    const removed = await bookmarkService.removeAllBookmarks('book-1')
    expect(removed).toBe(true)
  })

  it('returns false when removing all bookmarks for unknown book', async () => {
    mockPrisma.bookmark.deleteMany.mockResolvedValue({ count: 0 })
    const removed = await bookmarkService.removeAllBookmarks('unknown')
    expect(removed).toBe(false)
  })
})
