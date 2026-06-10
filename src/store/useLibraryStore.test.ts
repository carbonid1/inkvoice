import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Book } from '@/lib/types/book'
import { useLibraryStore } from './useLibraryStore'

const BOOKS: Book[] = [
  { id: 'the-odyssey', title: 'The Odyssey', author: 'Homer', filename: 'the-odyssey.epub' },
]

beforeEach(() => {
  useLibraryStore.setState({ books: [], loaded: false, fetching: false, error: null })
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('refreshBooks', () => {
  it('loads books and marks the store loaded', async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json(BOOKS))

    await useLibraryStore.getState().refreshBooks()

    const state = useLibraryStore.getState()

    expect(state.books).toEqual(BOOKS)
    expect(state.loaded).toBe(true)
    expect(state.error).toBeNull()
    expect(state.fetching).toBe(false)
  })

  it('records the error and still settles on a failed fetch', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 500 }))

    await useLibraryStore.getState().refreshBooks()

    const state = useLibraryStore.getState()

    expect(state.error).toBe('Failed to fetch books')
    expect(state.loaded).toBe(true)
    expect(state.books).toEqual([])
  })

  it('clears a previous error on a successful refetch', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 500 }))
    vi.mocked(fetch).mockResolvedValueOnce(Response.json(BOOKS))

    await useLibraryStore.getState().refreshBooks()
    expect(useLibraryStore.getState().error).toBe('Failed to fetch books')

    await useLibraryStore.getState().refreshBooks()

    expect(useLibraryStore.getState().error).toBeNull()
    expect(useLibraryStore.getState().books).toEqual(BOOKS)
  })

  it('dedupes concurrent calls into a single request', async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json(BOOKS))

    await Promise.all([
      useLibraryStore.getState().refreshBooks(),
      useLibraryStore.getState().refreshBooks(),
    ])

    expect(fetch).toHaveBeenCalledTimes(1)
  })
})

describe('loadBooks', () => {
  it('fetches when the store has never loaded', async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json(BOOKS))

    await useLibraryStore.getState().loadBooks()

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(useLibraryStore.getState().books).toEqual(BOOKS)
  })

  it('skips the fetch once a previous attempt settled, even a failed one', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 500 }))

    await useLibraryStore.getState().loadBooks()
    await useLibraryStore.getState().loadBooks()

    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('skips the fetch when books were provided via setBooks', async () => {
    useLibraryStore.getState().setBooks(BOOKS)

    await useLibraryStore.getState().loadBooks()

    expect(fetch).not.toHaveBeenCalled()
  })
})
