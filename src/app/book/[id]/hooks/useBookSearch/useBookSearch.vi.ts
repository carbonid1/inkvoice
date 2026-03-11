import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useBookSearch } from './useBookSearch'
import type { SearchResponse } from './useBookSearch.types'

const mockFetch = vi.fn()

beforeEach(() => {
  mockFetch.mockReset()
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.restoreAllMocks()
})

const mockSearchResponse = (overrides: Partial<SearchResponse> = {}): SearchResponse => ({
  query: 'test',
  matches: [
    {
      chapter: 0,
      sentence: 2,
      chapterTitle: 'Chapter 1',
      textSnippet: 'a test here',
      matchPositions: [2],
    },
    {
      chapter: 1,
      sentence: 5,
      chapterTitle: 'Chapter 2',
      textSnippet: 'another test',
      matchPositions: [8],
    },
    {
      chapter: 1,
      sentence: 10,
      chapterTitle: 'Chapter 2',
      textSnippet: 'test again',
      matchPositions: [0],
    },
  ],
  totalMatches: 3,
  truncated: false,
  ...overrides,
})

const setupWithResults = async () => {
  const response = mockSearchResponse()
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(response),
  })

  const { result } = renderHook(() => useBookSearch('book-1'))

  act(() => result.current.open())
  // Trigger query and debounce by directly calling fetchResults via setQuery
  act(() => result.current.setQuery('test'))

  // Advance past debounce timer
  await act(async () => {
    vi.useFakeTimers()
    vi.advanceTimersByTime(300)
    vi.useRealTimers()
    // Wait for the async fetch to resolve
    await new Promise(resolve => setTimeout(resolve, 0))
  })

  await waitFor(() => expect(result.current.results.length).toBe(3))

  return { result }
}

describe('useBookSearch', () => {
  it('starts closed with empty state', () => {
    const { result } = renderHook(() => useBookSearch('book-1'))
    expect(result.current.isOpen).toBe(false)
    expect(result.current.query).toBe('')
    expect(result.current.results).toEqual([])
    expect(result.current.highlightedMatch).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.truncated).toBe(false)
  })

  it('open sets isOpen to true', () => {
    const { result } = renderHook(() => useBookSearch('book-1'))
    act(() => result.current.open())
    expect(result.current.isOpen).toBe(true)
  })

  it('close resets all state', async () => {
    const { result } = await setupWithResults()

    act(() => result.current.close())
    expect(result.current.isOpen).toBe(false)
    expect(result.current.query).toBe('')
    expect(result.current.results).toEqual([])
  })

  it('highlightedMatch reflects results at highlightedIndex', async () => {
    const { result } = await setupWithResults()

    expect(result.current.highlightedMatch).toEqual(result.current.results[0])

    act(() => result.current.highlightNext())
    expect(result.current.highlightedMatch).toEqual(result.current.results[1])
  })

  it('callbacks are stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useBookSearch('book-1'))
    const firstOpen = result.current.open
    const firstClose = result.current.close
    const firstSetQuery = result.current.setQuery
    const firstHighlightNext = result.current.highlightNext
    const firstHighlightPrev = result.current.highlightPrevious
    const firstSetHighlightedIndex = result.current.setHighlightedIndex
    rerender()
    expect(result.current.open).toBe(firstOpen)
    expect(result.current.close).toBe(firstClose)
    expect(result.current.setQuery).toBe(firstSetQuery)
    expect(result.current.highlightNext).toBe(firstHighlightNext)
    expect(result.current.highlightPrevious).toBe(firstHighlightPrev)
    expect(result.current.setHighlightedIndex).toBe(firstSetHighlightedIndex)
  })

  describe('highlightedIndex', () => {
    it('initializes to 0', () => {
      const { result } = renderHook(() => useBookSearch('book-1'))
      expect(result.current.highlightedIndex).toBe(0)
    })

    it('highlightNext wraps around results length', async () => {
      const { result } = await setupWithResults()

      act(() => result.current.highlightNext())
      expect(result.current.highlightedIndex).toBe(1)

      act(() => result.current.highlightNext())
      expect(result.current.highlightedIndex).toBe(2)

      act(() => result.current.highlightNext())
      expect(result.current.highlightedIndex).toBe(0) // wraps
    })

    it('highlightPrevious wraps around results length', async () => {
      const { result } = await setupWithResults()

      act(() => result.current.highlightPrevious())
      expect(result.current.highlightedIndex).toBe(2) // wraps to end
    })

    it('resets to 0 when new results arrive', async () => {
      const { result } = await setupWithResults()

      // Move highlight
      act(() => result.current.highlightNext())
      expect(result.current.highlightedIndex).toBe(1)

      // Trigger new search
      const newResponse = mockSearchResponse({ query: 'new' })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newResponse),
      })
      act(() => result.current.setQuery('new'))
      await act(async () => {
        vi.useFakeTimers()
        vi.advanceTimersByTime(300)
        vi.useRealTimers()
      })
      // Wait for fetch to resolve and state to settle
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.highlightedIndex).toBe(0)
      })
    })

    it('close resets highlightedIndex', async () => {
      const { result } = await setupWithResults()

      act(() => result.current.highlightNext())
      expect(result.current.highlightedIndex).toBe(1)

      act(() => result.current.close())
      expect(result.current.highlightedIndex).toBe(0)
    })

    it('setHighlightedIndex sets arbitrary index', async () => {
      const { result } = await setupWithResults()

      act(() => result.current.setHighlightedIndex(2))
      expect(result.current.highlightedIndex).toBe(2)
    })
  })
})
