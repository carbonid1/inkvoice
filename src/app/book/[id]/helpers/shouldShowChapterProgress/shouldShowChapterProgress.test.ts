import { describe, expect, it } from 'vitest'
import { shouldShowChapterProgress } from './shouldShowChapterProgress'

describe('shouldShowChapterProgress', () => {
  it('returns false when chapter is below default threshold', () => {
    expect(shouldShowChapterProgress({ wordsInChapter: 1749 })).toBe(false)
  })

  it('returns true when chapter is at default threshold', () => {
    expect(shouldShowChapterProgress({ wordsInChapter: 1750 })).toBe(true)
  })

  it('returns true when chapter is above default threshold', () => {
    expect(shouldShowChapterProgress({ wordsInChapter: 5000 })).toBe(true)
  })

  it('respects custom threshold', () => {
    expect(shouldShowChapterProgress({ wordsInChapter: 500, threshold: 500 })).toBe(true)
    expect(shouldShowChapterProgress({ wordsInChapter: 499, threshold: 500 })).toBe(false)
  })
})
