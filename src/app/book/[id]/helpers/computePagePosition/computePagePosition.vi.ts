import { describe, expect, it } from 'vitest'
import { computePagePosition } from './computePagePosition'

describe('computePagePosition', () => {
  it('returns null for empty arrays', () => {
    expect(
      computePagePosition({
        chapter: 0,
        sentence: 0,
        wordsPerChapter: [],
        sentencesPerChapter: [],
      }),
    ).toBeNull()
  })

  it('returns null when total words is 0', () => {
    expect(
      computePagePosition({
        chapter: 0,
        sentence: 0,
        wordsPerChapter: [0, 0],
        sentencesPerChapter: [5, 5],
      }),
    ).toBeNull()
  })

  it('returns page 1 at start of book', () => {
    const result = computePagePosition({
      chapter: 0,
      sentence: 0,
      wordsPerChapter: [700, 700],
      sentencesPerChapter: [10, 10],
    })
    // 1400 words / 350 wpp = 4 pages
    expect(result).toEqual({ currentPage: 1, totalPages: 4 })
  })

  it('computes correct mid-book position', () => {
    // 1050 words total = 3 pages. Chapter 0 = 350 words, chapter 1 = 700 words.
    // At chapter 1, sentence 5/10 = halfway through ch1 = 350 + 350 = 700 words read
    // 700 / 350 = 2, floor + 1 = 3
    const result = computePagePosition({
      chapter: 1,
      sentence: 5,
      wordsPerChapter: [350, 700],
      sentencesPerChapter: [10, 10],
    })
    expect(result).toEqual({ currentPage: 3, totalPages: 3 })
  })

  it('does not exceed total pages', () => {
    // At the very end — chapter index past last chapter
    const result = computePagePosition({
      chapter: 2,
      sentence: 0,
      wordsPerChapter: [350, 350],
      sentencesPerChapter: [10, 10],
    })
    expect(result).toEqual({ currentPage: 2, totalPages: 2 })
  })

  it('handles single-chapter book', () => {
    const result = computePagePosition({
      chapter: 0,
      sentence: 0,
      wordsPerChapter: [100],
      sentencesPerChapter: [5],
    })
    expect(result).toEqual({ currentPage: 1, totalPages: 1 })
  })
})
