import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useBookPosition } from './useBookPosition'
import type { ChapterInfo } from '@/lib/types/book'

const makeChapters = (sentenceCounts: number[]): ChapterInfo[] =>
  sentenceCounts.map((n, i) => ({
    title: `Chapter ${i}`,
    sentenceCount: n,
  }))

const defaultProps = () => ({
  chapters: makeChapters([5, 3]),
  currentChapter: 0,
  currentSentence: 0,
  onProgressChange: vi.fn(),
})

describe('useBookPosition', () => {
  describe('callback referential stability', () => {
    it('advanceToNext is stable across re-renders (empty deps)', () => {
      const props = defaultProps()
      const { result, rerender } = renderHook(() => useBookPosition(props))
      const first = result.current.advanceToNext
      rerender()
      expect(result.current.advanceToNext).toBe(first)
    })

    it('getNextPosition is stable across re-renders (empty deps)', () => {
      const props = defaultProps()
      const { result, rerender } = renderHook(() => useBookPosition(props))
      const first = result.current.getNextPosition
      rerender()
      expect(result.current.getNextPosition).toBe(first)
    })

    it('skipBack is stable when same props passed', () => {
      const props = defaultProps()
      const { result, rerender } = renderHook(() => useBookPosition(props))
      const first = result.current.skipBack
      rerender()
      expect(result.current.skipBack).toBe(first)
    })

    it('skipForward is stable when same props passed', () => {
      const props = defaultProps()
      const { result, rerender } = renderHook(() => useBookPosition(props))
      const first = result.current.skipForward
      rerender()
      expect(result.current.skipForward).toBe(first)
    })

    it('skipBack changes when currentSentence changes', () => {
      const props = defaultProps()
      const { result, rerender } = renderHook(
        (p) => useBookPosition(p),
        { initialProps: props }
      )
      const first = result.current.skipBack
      rerender({ ...props, currentSentence: 1 })
      expect(result.current.skipBack).not.toBe(first)
    })
  })
})
