import { describe, expect, it } from 'vitest'
import { computeChapterProgressPercent } from './computeChapterProgressPercent'

describe('computeChapterProgressPercent', () => {
  it('returns null when paragraphsInChapter is 0', () => {
    expect(computeChapterProgressPercent({ paragraph: 5, paragraphsInChapter: 0 })).toBeNull()
  })

  it('returns 0 at the start of a chapter', () => {
    expect(computeChapterProgressPercent({ paragraph: 0, paragraphsInChapter: 50 })).toBe(0)
  })

  it('returns correct mid-chapter percentage', () => {
    expect(computeChapterProgressPercent({ paragraph: 25, paragraphsInChapter: 50 })).toBe(50)
  })

  it('returns 100 at the last paragraph', () => {
    expect(computeChapterProgressPercent({ paragraph: 50, paragraphsInChapter: 50 })).toBe(100)
  })
})
