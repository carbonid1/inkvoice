import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { useBookmarkToggle } from './useBookmarkToggle'

const mockFetch = vi.fn()

beforeEach(() => {
  useBookmarkStore.setState({ bookmarks: {} })
  mockFetch.mockReset()
  vi.stubGlobal('fetch', mockFetch)
})

describe('useBookmarkToggle', () => {
  it('toggle is stable across re-renders with same args', () => {
    const { result, rerender } = renderHook(() =>
      useBookmarkToggle({ bookId: 'book-1', chapter: 0, paragraph: 0 }),
    )
    const first = result.current.toggle

    rerender()
    expect(result.current.toggle).toBe(first)
  })

  it('toggle is stable when preview changes', () => {
    let preview = 'First sentence'
    const { result, rerender } = renderHook(() =>
      useBookmarkToggle({ bookId: 'book-1', chapter: 0, paragraph: 0, preview }),
    )
    const first = result.current.toggle

    preview = 'Second sentence'
    rerender()
    expect(result.current.toggle).toBe(first)
  })

  it('removes bookmark when already bookmarked', async () => {
    useBookmarkStore.setState({
      bookmarks: {
        'book-1': [{ id: 'bm-1', chapter: 2, paragraph: 5, createdAt: 1000 }],
      },
    })
    mockFetch.mockResolvedValueOnce({ ok: true })

    const { result } = renderHook(() =>
      useBookmarkToggle({ bookId: 'book-1', chapter: 2, paragraph: 5 }),
    )

    expect(result.current.isBookmarked).toBe(true)

    act(() => result.current.toggle())

    await waitFor(() => expect(result.current.isBookmarked).toBe(false))
    expect(mockFetch).toHaveBeenCalledWith('/api/bookmarks/book-1', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookmarkId: 'bm-1' }),
    })
  })

  it('adds bookmark when not bookmarked', async () => {
    const bookmark = { id: 'bm-1', chapter: 2, paragraph: 5, createdAt: Date.now() }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(bookmark),
    })

    const { result } = renderHook(() =>
      useBookmarkToggle({ bookId: 'book-1', chapter: 2, paragraph: 5 }),
    )

    expect(result.current.isBookmarked).toBe(false)

    await act(() => result.current.toggle())

    expect(result.current.isBookmarked).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith('/api/bookmarks/book-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapter: 2, paragraph: 5 }),
    })
  })

  it('passes preview text when adding bookmark', async () => {
    const bookmark = {
      id: 'bm-1',
      chapter: 0,
      paragraph: 0,
      createdAt: Date.now(),
      preview: 'Hello world',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(bookmark),
    })

    const { result } = renderHook(() =>
      useBookmarkToggle({ bookId: 'book-1', chapter: 0, paragraph: 0, preview: 'Hello world' }),
    )

    await act(() => result.current.toggle())

    expect(mockFetch).toHaveBeenCalledWith('/api/bookmarks/book-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapter: 0, paragraph: 0, preview: 'Hello world' }),
    })
  })
})
