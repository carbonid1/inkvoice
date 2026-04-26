import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ChapterInfo } from '@/lib/types/book'
import { useBookPosition } from './useBookPosition'

const makeChapters = (paragraphCounts: number[]): ChapterInfo[] =>
  paragraphCounts.map((n, i) => ({
    title: `Chapter ${i}`,
    paragraphCount: n,
    wordCount: n * 10,
  }))

const defaultProps = () => ({
  chapters: makeChapters([5, 3]),
  currentChapter: 0,
  currentParagraph: 0,
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

    it('skipBack changes when currentParagraph changes', () => {
      const props = defaultProps()
      const { result, rerender } = renderHook(p => useBookPosition(p), { initialProps: props })
      const first = result.current.skipBack

      rerender({ ...props, currentParagraph: 1 })
      expect(result.current.skipBack).not.toBe(first)
    })
  })
})
