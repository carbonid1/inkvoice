import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePrefetchQueue } from './usePrefetchQueue'
import type { ParsedChapter } from '@/lib/types/book'

const makeChapters = (sentenceCounts: number[]): ParsedChapter[] =>
  sentenceCounts.map((n, i) => ({
    title: `Chapter ${i}`,
    sentences: Array.from({ length: n }, (_, j) => `Sentence ${j}`),
  }))

const stableOptions = () => {
  const chapters = makeChapters([5, 3])
  return {
    bookId: 'test-book',
    voice: 'narrator',
    chaptersRef: { current: chapters },
    currentChapterRef: { current: 0 },
    currentSentenceRef: { current: 0 },
    onDebugUpdate: vi.fn(),
  }
}

describe('usePrefetchQueue', () => {
  describe('callback referential stability', () => {
    const callbacks = [
      'fetchAudio',
      'continuePrefetching',
      'updateDebugMetrics',
      'resetFailures',
    ] as const

    callbacks.forEach((name) => {
      it(`${name} is stable across re-renders`, () => {
        const opts = stableOptions()
        const { result, rerender } = renderHook(() => usePrefetchQueue(opts))
        const first = result.current[name]
        rerender()
        expect(result.current[name]).toBe(first)
      })
    })

    it('cacheStatsRef is stable across re-renders', () => {
      const opts = stableOptions()
      const { result, rerender } = renderHook(() => usePrefetchQueue(opts))
      const first = result.current.cacheStatsRef
      rerender()
      expect(result.current.cacheStatsRef).toBe(first)
    })
  })
})
