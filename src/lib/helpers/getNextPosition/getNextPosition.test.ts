import type { ChapterInfo } from '@/lib/types/book'
import { describe, expect, it } from 'vitest'
import { getNextPosition } from './getNextPosition'

const makeChapters = (paragraphCounts: number[]): ChapterInfo[] =>
  paragraphCounts.map((n, i) => ({
    title: `Chapter ${i}`,
    paragraphCount: n,
    wordCount: n * 10,
  }))

describe('getNextPosition', () => {
  it('returns next paragraph in same chapter', () => {
    const chapters = makeChapters([5, 3])
    expect(getNextPosition(chapters, 0, 2)).toEqual({ ch: 0, para: 3 })
  })

  it('crosses chapter boundary', () => {
    const chapters = makeChapters([3, 5])
    expect(getNextPosition(chapters, 0, 2)).toEqual({ ch: 1, para: 0 })
  })

  it('returns null at end of book', () => {
    const chapters = makeChapters([3, 2])
    expect(getNextPosition(chapters, 1, 1)).toBeNull()
  })

  it('returns null for empty chapters array', () => {
    expect(getNextPosition([], 0, 0)).toBeNull()
  })
})
