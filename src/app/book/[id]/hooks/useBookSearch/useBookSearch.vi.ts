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
    expect(result.current.totalMatches).toBe(0)
    expect(result.current.currentMatchIndex).toBe(0)
    expect(result.current.currentMatch).toBeNull()
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
    expect(result.current.totalMatches).toBe(0)
    expect(result.current.currentMatchIndex).toBe(0)
  })

  it('goToNextMatch wraps around', async () => {
    const { result } = await setupWithResults()

    expect(result.current.currentMatchIndex).toBe(0)

    act(() => result.current.goToNextMatch())
    expect(result.current.currentMatchIndex).toBe(1)

    act(() => result.current.goToNextMatch())
    expect(result.current.currentMatchIndex).toBe(2)

    act(() => result.current.goToNextMatch())
    expect(result.current.currentMatchIndex).toBe(0) // wraps
  })

  it('goToPreviousMatch wraps around', async () => {
    const { result } = await setupWithResults()

    expect(result.current.currentMatchIndex).toBe(0)

    act(() => result.current.goToPreviousMatch())
    expect(result.current.currentMatchIndex).toBe(2) // wraps to end
  })

  it('callbacks are stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useBookSearch('book-1'))
    const firstOpen = result.current.open
    const firstClose = result.current.close
    const firstSetQuery = result.current.setQuery
    const firstGoToNext = result.current.goToNextMatch
    const firstGoToPrev = result.current.goToPreviousMatch
    rerender()
    expect(result.current.open).toBe(firstOpen)
    expect(result.current.close).toBe(firstClose)
    expect(result.current.setQuery).toBe(firstSetQuery)
    expect(result.current.goToNextMatch).toBe(firstGoToNext)
    expect(result.current.goToPreviousMatch).toBe(firstGoToPrev)
  })
})
