import { describe, expect, it } from 'vitest'
import { computeChapterPagePosition } from './computeChapterPagePosition'

describe('computeChapterPagePosition', () => {
  it('returns null when wordCount is 0', () => {
    expect(
      computeChapterPagePosition({ paragraph: 0, paragraphCount: 10, wordCount: 0 }),
    ).toBeNull()
  })

  it('returns null when paragraphCount is 0', () => {
    expect(
      computeChapterPagePosition({ paragraph: 0, paragraphCount: 0, wordCount: 1000 }),
    ).toBeNull()
  })

  it('returns page 1 of 1 for a short chapter', () => {
    const result = computeChapterPagePosition({ paragraph: 5, paragraphCount: 10, wordCount: 200 })

    expect(result).toEqual({ currentPage: 1, totalPages: 1 })
  })

  it('returns correct page for mid-chapter position', () => {
    // 700 words = 2 pages. Paragraph 50/100 = 50% = 350 words read = page 2
    const result = computeChapterPagePosition({
      paragraph: 50,
      paragraphCount: 100,
      wordCount: 700,
    })

    expect(result).toEqual({ currentPage: 2, totalPages: 2 })
  })

  it('returns page 1 at the start of a chapter', () => {
    const result = computeChapterPagePosition({
      paragraph: 0,
      paragraphCount: 100,
      wordCount: 3500,
    })

    expect(result).toEqual({ currentPage: 1, totalPages: 10 })
  })

  it('clamps currentPage to totalPages at the end', () => {
    // paragraph === paragraphCount would be 100% but shouldn't exceed totalPages
    const result = computeChapterPagePosition({
      paragraph: 100,
      paragraphCount: 100,
      wordCount: 700,
    })

    expect(result).toEqual({ currentPage: 2, totalPages: 2 })
  })
})
