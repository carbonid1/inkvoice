import { describe, expect, it } from 'vitest'
import { computeChapterProgressPercent } from './computeChapterProgressPercent'

describe('computeChapterProgressPercent', () => {
  it('returns null when sentencesInChapter is 0', () => {
    expect(computeChapterProgressPercent({ sentence: 5, sentencesInChapter: 0 })).toBeNull()
  })

  it('returns 0 at the start of a chapter', () => {
    expect(computeChapterProgressPercent({ sentence: 0, sentencesInChapter: 50 })).toBe(0)
  })

  it('returns correct mid-chapter percentage', () => {
    expect(computeChapterProgressPercent({ sentence: 25, sentencesInChapter: 50 })).toBe(50)
  })

  it('returns 100 at the last sentence', () => {
    expect(computeChapterProgressPercent({ sentence: 50, sentencesInChapter: 50 })).toBe(100)
  })
})
