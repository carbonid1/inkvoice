import { describe, expect, it } from 'vitest'
import { computeProgressPercent } from './computeProgressPercent'

describe('computeProgressPercent', () => {
  it('returns null for undefined progress', () => {
    expect(computeProgressPercent(undefined)).toBeNull()
  })

  it('returns null when paragraphsPerChapter is missing', () => {
    expect(computeProgressPercent({ chapter: 0, paragraph: 0 })).toBeNull()
    expect(
      computeProgressPercent({ chapter: 0, paragraph: 0, paragraphsPerChapter: [] }),
    ).toBeNull()
  })

  it('returns 0 at the start of a book', () => {
    const result = computeProgressPercent({
      chapter: 0,
      paragraph: 0,
      paragraphsPerChapter: [10, 20, 10],
    })

    expect(result).toBe(0)
  })

  it('returns correct mid-book percentage', () => {
    // chapter 1, paragraph 5 -> completed: 10 (ch0) + 5 = 15 out of 40
    const result = computeProgressPercent({
      chapter: 1,
      paragraph: 5,
      paragraphsPerChapter: [10, 20, 10],
    })

    expect(result).toBe(37.5)
  })

  it('returns 100 at the end of a book', () => {
    const result = computeProgressPercent({
      chapter: 3,
      paragraph: 0,
      paragraphsPerChapter: [10, 20, 10],
    })

    // completed: 10 + 20 + 10 + 0 = 40 out of 40
    expect(result).toBe(100)
  })
})
