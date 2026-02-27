import type { Bookmark } from '@/lib/services/bookmark/bookmark.types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBookmarkStore } from './useBookmarkStore'

const mockBookmark = (overrides: Partial<Bookmark> = {}): Bookmark => ({
  id: 'bm-1',
  chapter: 2,
  sentence: 5,
  createdAt: 1000,
  ...overrides,
})

beforeEach(() => {
  useBookmarkStore.setState({ bookmarks: {} })
  vi.restoreAllMocks()
})

describe('fetchBookmarks', () => {
  it('populates state from API', async () => {
    const bookmarks = [mockBookmark(), mockBookmark({ id: 'bm-2', chapter: 3 })]
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(bookmarks),
      }),
    )

    await useBookmarkStore.getState().fetchBookmarks('book-1')

    expect(useBookmarkStore.getState().bookmarks['book-1']).toEqual(bookmarks)
    expect(fetch).toHaveBeenCalledWith('/api/bookmarks/book-1')
  })
})

describe('addBookmark', () => {
  it('calls API and appends to local state', async () => {
    const existing = mockBookmark({ id: 'bm-1', chapter: 1, sentence: 0 })
    useBookmarkStore.setState({ bookmarks: { 'book-1': [existing] } })

    const created = mockBookmark({ id: 'bm-2', chapter: 3, sentence: 7 })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(created),
      }),
    )

    const result = await useBookmarkStore.getState().addBookmark('book-1', 3, 7)

    expect(result).toEqual(created)
    expect(useBookmarkStore.getState().bookmarks['book-1']).toEqual([existing, created])
    expect(fetch).toHaveBeenCalledWith('/api/bookmarks/book-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapter: 3, sentence: 7 }),
    })
  })
})

describe('removeBookmark', () => {
  it('calls API and removes from local state', async () => {
    const keep = mockBookmark({ id: 'bm-1', chapter: 1, sentence: 0 })
    const remove = mockBookmark({ id: 'bm-2', chapter: 3, sentence: 7 })
    useBookmarkStore.setState({ bookmarks: { 'book-1': [keep, remove] } })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      }),
    )

    await useBookmarkStore.getState().removeBookmark('book-1', 'bm-2')

    expect(useBookmarkStore.getState().bookmarks['book-1']).toEqual([keep])
    expect(fetch).toHaveBeenCalledWith('/api/bookmarks/book-1', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookmarkId: 'bm-2' }),
    })
  })
})

describe('isBookmarked', () => {
  it('returns true for matching chapter and sentence', () => {
    useBookmarkStore.setState({
      bookmarks: { 'book-1': [mockBookmark({ chapter: 2, sentence: 5 })] },
    })

    expect(useBookmarkStore.getState().isBookmarked('book-1', 2, 5)).toBe(true)
  })

  it('returns false for non-matching position', () => {
    useBookmarkStore.setState({
      bookmarks: { 'book-1': [mockBookmark({ chapter: 2, sentence: 5 })] },
    })

    expect(useBookmarkStore.getState().isBookmarked('book-1', 2, 6)).toBe(false)
  })

  it('returns false for unknown bookId without crashing', () => {
    expect(useBookmarkStore.getState().isBookmarked('unknown', 0, 0)).toBe(false)
  })
})
