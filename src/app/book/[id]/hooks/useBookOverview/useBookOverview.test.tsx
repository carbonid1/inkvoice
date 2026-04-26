import { renderHook, waitFor } from '@testing-library/react'
import { StrictMode, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { BookOverview, ChapterInfo } from '@/lib/types/book'
import { useBookOverview } from './useBookOverview'

vi.mock('@/store/useHydrated', () => ({
  useHydrated: vi.fn(() => true),
}))

const mockGetProgress = vi.fn(() => ({ chapter: 0, paragraph: 0 }))
const mockSetBookMetadata = vi.fn()

vi.mock('@/store/useProgressStore', () => ({
  useProgressStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      getProgress: mockGetProgress,
      setBookMetadata: mockSetBookMetadata,
    }),
}))

const mockSetCurrentBook = vi.fn()

vi.mock('@/store/useLibraryStore', () => ({
  useLibraryStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      setCurrentBook: mockSetCurrentBook,
    }),
}))

const makeChapters = (paragraphCounts: number[]): ChapterInfo[] =>
  paragraphCounts.map((n, i) => ({
    title: `Chapter ${i}`,
    paragraphCount: n,
    wordCount: n * 10,
  }))

const makeOverview = (paragraphCounts: number[] = [5, 3]): BookOverview => ({
  id: 'book-1',
  title: 'Test Book',
  author: 'Author',
  chapters: makeChapters(paragraphCounts),
})

const wrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>

describe('useBookOverview', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    mockGetProgress.mockReturnValue({ chapter: 0, paragraph: 0 })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns loading initially with null position', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useBookOverview('book-1'), { wrapper })

    expect(result.current.loading).toBe(true)
    expect(result.current.overview).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.initialChapter).toBeNull()
    expect(result.current.initialParagraph).toBeNull()
  })

  it('fetches overview and returns data', async () => {
    const overview = makeOverview()

    vi.mocked(fetch).mockResolvedValue(Response.json(overview))

    const { result } = renderHook(() => useBookOverview('book-1'), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.overview).toEqual(overview)
    expect(result.current.error).toBeNull()
    expect(mockSetCurrentBook).toHaveBeenCalledWith('book-1')
    expect(mockSetBookMetadata).toHaveBeenCalledWith('book-1', [5, 3], [50, 30])
  })

  it('restores valid position from progress store', async () => {
    mockGetProgress.mockReturnValue({ chapter: 1, paragraph: 2 })
    const overview = makeOverview()

    vi.mocked(fetch).mockResolvedValue(Response.json(overview))

    const { result } = renderHook(() => useBookOverview('book-1'), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.initialChapter).toBe(1)
    expect(result.current.initialParagraph).toBe(2)
  })

  it('clamps out-of-bounds chapter position', async () => {
    mockGetProgress.mockReturnValue({ chapter: 10, paragraph: 0 })
    const overview = makeOverview()

    vi.mocked(fetch).mockResolvedValue(Response.json(overview))

    const { result } = renderHook(() => useBookOverview('book-1'), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    // Chapter 10 >= chapters.length (2), so initial values stay at defaults
    expect(result.current.initialChapter).toBe(0)
    expect(result.current.initialParagraph).toBe(0)
  })

  it('clamps out-of-bounds paragraph position', async () => {
    mockGetProgress.mockReturnValue({ chapter: 0, paragraph: 99 })
    const overview = makeOverview()

    vi.mocked(fetch).mockResolvedValue(Response.json(overview))

    const { result } = renderHook(() => useBookOverview('book-1'), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.initialChapter).toBe(0)
    // Paragraph 99 >= paragraphCount (5), so paragraph stays at default
    expect(result.current.initialParagraph).toBe(0)
  })

  it('returns error on fetch failure', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 404 }))

    const { result } = renderHook(() => useBookOverview('book-1'), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Book not found')
    expect(result.current.overview).toBeNull()
  })

  it('returns generic error on non-404 failure', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 500 }))

    const { result } = renderHook(() => useBookOverview('book-1'), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Failed to load book')
  })
})
