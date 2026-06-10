import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildPregenJob } from '@/lib/services/pregenQueue/pregenQueue.fixtures'
import { PREGEN_JOB_STATUS, type PregenJob } from '@/lib/services/pregenQueue/pregenQueue.types'
import type { ChapterInfo } from '@/lib/types/book'
import { usePregenStore } from '@/store/usePregenStore'
import { useAudioGenerationStatus } from './useAudioGenerationStatus'

const CHAPTERS: ChapterInfo[] = [
  { title: 'One', paragraphCount: 40, wordCount: 2000 },
  { title: 'Two', paragraphCount: 60, wordCount: 3000 },
  { title: 'Three', paragraphCount: 30, wordCount: 1500 },
]

// A job mid-generation with its frontier at chapter 1, paragraph 5.
const buildRunningJob = (overrides: Partial<PregenJob> = {}): PregenJob =>
  buildPregenJob({
    status: PREGEN_JOB_STATUS.IN_PROGRESS,
    totalParagraphs: 130,
    completedParagraphs: 45,
    currentChapter: 1,
    currentParagraph: 5,
    ...overrides,
  })

interface HookProps {
  currentChapter: number
  currentParagraph: number
  missingAudioParagraphs: Set<number> | null
}

const renderStatusHook = (initialProps: HookProps, onAudioReady: () => void = vi.fn()) =>
  renderHook(
    (props: HookProps) =>
      useAudioGenerationStatus({
        bookId: 'book-1',
        chapters: CHAPTERS,
        onAudioReady,
        ...props,
      }),
    { initialProps },
  )

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  usePregenStore.setState({
    jobs: {},
    progressSamples: {},
    pendingGenerationRequest: null,
    panelOpen: false,
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useAudioGenerationStatus', () => {
  it('reports no status while the current paragraph has audio', () => {
    const { result } = renderStatusHook({
      currentChapter: 2,
      currentParagraph: 5,
      missingAudioParagraphs: new Set([9]),
    })

    expect(result.current).toBeNull()
  })

  it('explains a missing paragraph with no generation running and offers the action', () => {
    const { result } = renderStatusHook({
      currentChapter: 2,
      currentParagraph: 5,
      missingAudioParagraphs: new Set([5]),
    })

    expect(result.current).toEqual({
      message: 'No audio has been generated for this paragraph yet',
      onGenerateFromHere: expect.any(Function),
    })
  })

  it('shows a live ETA while generation runs behind the reader', () => {
    usePregenStore.setState({
      jobs: { 'book-1': buildRunningJob() },
      // 30 paragraphs over 60 seconds = 0.5 paragraphs per second.
      progressSamples: {
        'book-1': [
          { at: 0, completedParagraphs: 100 },
          { at: 60_000, completedParagraphs: 130 },
        ],
      },
    })

    const { result } = renderStatusHook({
      currentChapter: 2,
      currentParagraph: 5,
      missingAudioParagraphs: new Set([5]),
    })

    // Frontier (1, 5) → reader (2, 5) = 60 paragraphs ≈ 120s at 0.5/s.
    expect(result.current?.message).toBe('Audio is generating — about 2m away')
    expect(result.current?.onGenerateFromHere).toBeDefined()
  })

  it('reports paused generation', () => {
    usePregenStore.setState({
      jobs: { 'book-1': buildRunningJob({ status: PREGEN_JOB_STATUS.PAUSED }) },
    })

    const { result } = renderStatusHook({
      currentChapter: 2,
      currentParagraph: 5,
      missingAudioParagraphs: new Set([5]),
    })

    expect(result.current?.message).toBe('Audio generation for this book is paused')
  })

  it('turns the wait into autoplay: pending after the action, onAudioReady once audio lands', async () => {
    usePregenStore.setState({ jobs: { 'book-1': buildRunningJob() } })
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(buildRunningJob({ currentChapter: 2, currentParagraph: 5 }))),
    )
    const onAudioReady = vi.fn()
    const { result, rerender } = renderStatusHook(
      { currentChapter: 2, currentParagraph: 5, missingAudioParagraphs: new Set([5]) },
      onAudioReady,
    )

    await act(async () => {
      result.current?.onGenerateFromHere?.()
      await Promise.resolve()
    })

    expect(result.current?.pending).toBe(true)
    expect(result.current?.onGenerateFromHere).toBeUndefined()
    expect(onAudioReady).not.toHaveBeenCalled()

    rerender({ currentChapter: 2, currentParagraph: 5, missingAudioParagraphs: new Set() })

    await waitFor(() => expect(onAudioReady).toHaveBeenCalledOnce())
    expect(result.current).toBeNull()
  })

  it('cancels the pending autoplay when the reader moves away', async () => {
    usePregenStore.setState({ jobs: { 'book-1': buildRunningJob() } })
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(buildRunningJob({ currentChapter: 2, currentParagraph: 5 }))),
    )
    const onAudioReady = vi.fn()
    const { result, rerender } = renderStatusHook(
      { currentChapter: 2, currentParagraph: 5, missingAudioParagraphs: new Set([5, 6]) },
      onAudioReady,
    )

    await act(async () => {
      result.current?.onGenerateFromHere?.()
      await Promise.resolve()
    })

    rerender({ currentChapter: 2, currentParagraph: 6, missingAudioParagraphs: new Set([5, 6]) })
    // Audio for the originally requested paragraph arrives after the move.
    rerender({ currentChapter: 2, currentParagraph: 6, missingAudioParagraphs: new Set([6]) })

    await new Promise(resolve => setTimeout(resolve, 0))
    expect(onAudioReady).not.toHaveBeenCalled()
    expect(result.current?.pending).not.toBe(true)
    expect(result.current?.onGenerateFromHere).toBeDefined()
  })

  it('clears the pending state when the generation request fails', async () => {
    usePregenStore.setState({ jobs: { 'book-1': buildRunningJob() } })
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 500 }))

    const { result } = renderStatusHook({
      currentChapter: 2,
      currentParagraph: 5,
      missingAudioParagraphs: new Set([5]),
    })

    await act(async () => {
      result.current?.onGenerateFromHere?.()
      await Promise.resolve()
    })

    expect(result.current?.pending).not.toBe(true)
    expect(result.current?.onGenerateFromHere).toBeDefined()
  })

  it('keeps onGenerateFromHere referentially stable across rerenders', () => {
    const { result, rerender } = renderStatusHook({
      currentChapter: 2,
      currentParagraph: 5,
      missingAudioParagraphs: new Set([5]),
    })
    const first = result.current?.onGenerateFromHere

    expect(first).toBeDefined()
    rerender({ currentChapter: 2, currentParagraph: 5, missingAudioParagraphs: new Set([5]) })
    expect(result.current?.onGenerateFromHere).toBe(first)
  })
})
