import type { ChapterInfo } from '@/lib/types/book'
import { describe, expect, it } from 'vitest'
import { getNextPosition } from './getNextPosition'

const makeChapters = (sentenceCounts: number[]): ChapterInfo[] =>
  sentenceCounts.map((n, i) => ({
    title: `Chapter ${i}`,
    sentenceCount: n,
  }))

describe('getNextPosition', () => {
  it('returns next sentence in same chapter', () => {
    const chapters = makeChapters([5, 3])
    expect(getNextPosition(chapters, 0, 2)).toEqual({ ch: 0, sent: 3 })
  })

  it('crosses chapter boundary', () => {
    const chapters = makeChapters([3, 5])
    expect(getNextPosition(chapters, 0, 2)).toEqual({ ch: 1, sent: 0 })
  })

  it('returns null at end of book', () => {
    const chapters = makeChapters([3, 2])
    expect(getNextPosition(chapters, 1, 1)).toBeNull()
  })

  it('returns null for empty chapters array', () => {
    expect(getNextPosition([], 0, 0)).toBeNull()
  })
})
