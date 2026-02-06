import { describe, it, expect } from 'vitest'
import { computeProgressPercent } from './computeProgressPercent'

describe('computeProgressPercent', () => {
  it('returns null for undefined progress', () => {
    expect(computeProgressPercent(undefined)).toBeNull()
  })

  it('returns null when sentencesPerChapter is missing', () => {
    expect(computeProgressPercent({ chapter: 0, sentence: 0 })).toBeNull()
    expect(computeProgressPercent({ chapter: 0, sentence: 0, sentencesPerChapter: [] })).toBeNull()
  })

  it('returns 0 at the start of a book', () => {
    const result = computeProgressPercent({
      chapter: 0,
      sentence: 0,
      sentencesPerChapter: [10, 20, 10],
    })
    expect(result).toBe(0)
  })

  it('returns correct mid-book percentage', () => {
    // chapter 1, sentence 5 -> completed: 10 (ch0) + 5 = 15 out of 40
    const result = computeProgressPercent({
      chapter: 1,
      sentence: 5,
      sentencesPerChapter: [10, 20, 10],
    })
    expect(result).toBe(37.5)
  })

  it('returns 100 at the end of a book', () => {
    const result = computeProgressPercent({
      chapter: 3,
      sentence: 0,
      sentencesPerChapter: [10, 20, 10],
    })
    // completed: 10 + 20 + 10 + 0 = 40 out of 40
    expect(result).toBe(100)
  })
})
