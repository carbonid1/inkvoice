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

  it('saves deleted bookmark to lastDeleted', async () => {
    const bookmark = mockBookmark({ id: 'bm-1', chapter: 2, sentence: 5 })
    useBookmarkStore.setState({ bookmarks: { 'book-1': [bookmark] } })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      }),
    )

    await useBookmarkStore.getState().removeBookmark('book-1', 'bm-1')

    const { lastDeleted } = useBookmarkStore.getState()
    expect(lastDeleted).not.toBeNull()
    expect(lastDeleted?.bookId).toBe('book-1')
    expect(lastDeleted?.bookmark).toEqual(bookmark)
  })
})

describe('undoRemoveBookmark', () => {
  it('re-adds the deleted bookmark and clears lastDeleted', async () => {
    const bookmark = mockBookmark({ id: 'bm-1', chapter: 2, sentence: 5, preview: 'Hello world' })
    useBookmarkStore.setState({ bookmarks: { 'book-1': [bookmark] } })

    let callCount = 0
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        callCount++
        // First call = DELETE (removeBookmark), second call = POST (addBookmark via undo)
        const result = callCount === 1 ? { success: true } : { ...bookmark, id: 'bm-new' }
        return Promise.resolve({ ok: true, json: () => Promise.resolve(result) })
      }),
    )

    await useBookmarkStore.getState().removeBookmark('book-1', 'bm-1')
    expect(useBookmarkStore.getState().lastDeleted).not.toBeNull()
    expect(useBookmarkStore.getState().bookmarks['book-1']).toEqual([])

    await useBookmarkStore.getState().undoRemoveBookmark()
    expect(useBookmarkStore.getState().lastDeleted).toBeNull()
    const restored = useBookmarkStore.getState().bookmarks['book-1'] ?? []
    expect(restored).toHaveLength(1)
    expect(restored[0]?.chapter).toBe(2)
    expect(restored[0]?.sentence).toBe(5)
  })

  it('is a no-op when lastDeleted is null', async () => {
    vi.stubGlobal('fetch', vi.fn())
    await useBookmarkStore.getState().undoRemoveBookmark()
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('clearLastDeleted', () => {
  it('resets lastDeleted to null', async () => {
    const bookmark = mockBookmark()
    useBookmarkStore.setState({ bookmarks: { 'book-1': [bookmark] } })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      }),
    )

    await useBookmarkStore.getState().removeBookmark('book-1', 'bm-1')
    expect(useBookmarkStore.getState().lastDeleted).not.toBeNull()

    useBookmarkStore.getState().clearLastDeleted()
    expect(useBookmarkStore.getState().lastDeleted).toBeNull()
  })
})

describe('sequential deletes', () => {
  it('overwrites lastDeleted with the latest deletion', async () => {
    const first = mockBookmark({ id: 'bm-1', chapter: 1, sentence: 0 })
    const second = mockBookmark({ id: 'bm-2', chapter: 3, sentence: 7 })
    useBookmarkStore.setState({ bookmarks: { 'book-1': [first, second] } })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      }),
    )

    await useBookmarkStore.getState().removeBookmark('book-1', 'bm-1')
    await useBookmarkStore.getState().removeBookmark('book-1', 'bm-2')

    const { lastDeleted } = useBookmarkStore.getState()
    expect(lastDeleted?.bookmark.id).toBe('bm-2')
  })
})

describe('auto-clear timer', () => {
  it('clears lastDeleted after 5 seconds', async () => {
    vi.useFakeTimers()

    const bookmark = mockBookmark()
    useBookmarkStore.setState({ bookmarks: { 'book-1': [bookmark] } })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      }),
    )

    await useBookmarkStore.getState().removeBookmark('book-1', 'bm-1')
    expect(useBookmarkStore.getState().lastDeleted).not.toBeNull()

    vi.advanceTimersByTime(5000)
    expect(useBookmarkStore.getState().lastDeleted).toBeNull()

    vi.useRealTimers()
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
