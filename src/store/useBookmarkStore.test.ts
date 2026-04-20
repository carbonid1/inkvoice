import type { Bookmark } from '@/lib/services/bookmark/bookmark.types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBookmarkStore } from './useBookmarkStore'

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
}

const createDeferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const mockBookmark = (overrides: Partial<Bookmark> = {}): Bookmark => ({
  id: 'bm-1',
  chapter: 2,
  paragraph: 5,
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
  it('adds bookmark to state before API responds', async () => {
    const deferred = createDeferred<Response>()
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(deferred.promise))

    const promise = useBookmarkStore.getState().addBookmark('book-1', 3, 7, 'Hello')

    // State updated immediately, before fetch resolves
    const bookmarks = useBookmarkStore.getState().bookmarks['book-1'] ?? []
    expect(bookmarks).toHaveLength(1)
    expect(bookmarks[0]?.chapter).toBe(3)
    expect(bookmarks[0]?.paragraph).toBe(7)
    expect(bookmarks[0]?.preview).toBe('Hello')
    expect(useBookmarkStore.getState().isBookmarked('book-1', 3, 7)).toBe(true)

    // Resolve to clean up
    const serverBookmark = mockBookmark({ id: 'server-id', chapter: 3, paragraph: 7 })
    deferred.resolve({ ok: true, json: () => Promise.resolve(serverBookmark) } as Response)
    await promise
  })

  it('replaces optimistic bookmark with server response', async () => {
    const serverBookmark = mockBookmark({
      id: 'server-id',
      chapter: 3,
      paragraph: 7,
      preview: 'Hello',
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(serverBookmark),
      }),
    )

    const result = await useBookmarkStore.getState().addBookmark('book-1', 3, 7, 'Hello')

    expect(result).toEqual(serverBookmark)
    const bookmarks = useBookmarkStore.getState().bookmarks['book-1'] ?? []
    expect(bookmarks).toHaveLength(1)
    expect(bookmarks[0]?.id).toBe('server-id')
  })

  it('rolls back optimistic add on API failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    await expect(useBookmarkStore.getState().addBookmark('book-1', 3, 7)).rejects.toThrow(
      'Network error',
    )

    expect(useBookmarkStore.getState().bookmarks['book-1'] ?? []).toEqual([])
    expect(useBookmarkStore.getState().isBookmarked('book-1', 3, 7)).toBe(false)
  })

  it('preserves existing bookmarks on add', async () => {
    const existing = mockBookmark({ id: 'bm-1', chapter: 1, paragraph: 0 })
    useBookmarkStore.setState({ bookmarks: { 'book-1': [existing] } })

    const created = mockBookmark({ id: 'server-id', chapter: 3, paragraph: 7 })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(created),
      }),
    )

    await useBookmarkStore.getState().addBookmark('book-1', 3, 7)

    const bookmarks = useBookmarkStore.getState().bookmarks['book-1'] ?? []
    expect(bookmarks).toHaveLength(2)
    expect(bookmarks[0]).toEqual(existing)
    expect(bookmarks[1]?.id).toBe('server-id')
  })
})

describe('removeBookmark', () => {
  it('removes from state before API responds', async () => {
    const keep = mockBookmark({ id: 'bm-1', chapter: 1, paragraph: 0 })
    const remove = mockBookmark({ id: 'bm-2', chapter: 3, paragraph: 7 })
    useBookmarkStore.setState({ bookmarks: { 'book-1': [keep, remove] } })

    const deferred = createDeferred<Response>()
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(deferred.promise))

    const promise = useBookmarkStore.getState().removeBookmark('book-1', 'bm-2')

    // State updated immediately
    expect(useBookmarkStore.getState().bookmarks['book-1']).toEqual([keep])
    expect(useBookmarkStore.getState().isBookmarked('book-1', 3, 7)).toBe(false)

    deferred.resolve({ ok: true } as Response)
    await promise
  })

  it('sets lastDeleted before API responds', async () => {
    const bookmark = mockBookmark({ id: 'bm-1', chapter: 2, paragraph: 5 })
    useBookmarkStore.setState({ bookmarks: { 'book-1': [bookmark] } })

    const deferred = createDeferred<Response>()
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(deferred.promise))

    const promise = useBookmarkStore.getState().removeBookmark('book-1', 'bm-1')

    const { lastDeleted } = useBookmarkStore.getState()
    expect(lastDeleted).not.toBeNull()
    expect(lastDeleted?.bookId).toBe('book-1')
    expect(lastDeleted?.bookmark).toEqual(bookmark)

    deferred.resolve({ ok: true } as Response)
    await promise
  })

  it('rolls back on API failure', async () => {
    const bookmark = mockBookmark({ id: 'bm-1', chapter: 2, paragraph: 5 })
    useBookmarkStore.setState({ bookmarks: { 'book-1': [bookmark] } })

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    await useBookmarkStore.getState().removeBookmark('book-1', 'bm-1')

    // Bookmark restored
    expect(useBookmarkStore.getState().bookmarks['book-1']).toEqual([bookmark])
    expect(useBookmarkStore.getState().isBookmarked('book-1', 2, 5)).toBe(true)
    // lastDeleted cleared since delete didn't persist
    expect(useBookmarkStore.getState().lastDeleted).toBeNull()
  })

  it('calls API with correct params', async () => {
    const bookmark = mockBookmark({ id: 'bm-1', chapter: 2, paragraph: 5 })
    useBookmarkStore.setState({ bookmarks: { 'book-1': [bookmark] } })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))

    await useBookmarkStore.getState().removeBookmark('book-1', 'bm-1')

    expect(fetch).toHaveBeenCalledWith('/api/bookmarks/book-1', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookmarkId: 'bm-1' }),
    })
  })
})

describe('undoRemoveBookmark', () => {
  it('re-adds the deleted bookmark and clears lastDeleted', async () => {
    const bookmark = mockBookmark({ id: 'bm-1', chapter: 2, paragraph: 5, preview: 'Hello world' })
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
    expect(restored[0]?.paragraph).toBe(5)
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
    const first = mockBookmark({ id: 'bm-1', chapter: 1, paragraph: 0 })
    const second = mockBookmark({ id: 'bm-2', chapter: 3, paragraph: 7 })
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
  it('returns true for matching chapter and paragraph', () => {
    useBookmarkStore.setState({
      bookmarks: { 'book-1': [mockBookmark({ chapter: 2, paragraph: 5 })] },
    })

    expect(useBookmarkStore.getState().isBookmarked('book-1', 2, 5)).toBe(true)
  })

  it('returns false for non-matching position', () => {
    useBookmarkStore.setState({
      bookmarks: { 'book-1': [mockBookmark({ chapter: 2, paragraph: 5 })] },
    })

    expect(useBookmarkStore.getState().isBookmarked('book-1', 2, 6)).toBe(false)
  })

  it('returns false for unknown bookId without crashing', () => {
    expect(useBookmarkStore.getState().isBookmarked('unknown', 0, 0)).toBe(false)
  })
})
