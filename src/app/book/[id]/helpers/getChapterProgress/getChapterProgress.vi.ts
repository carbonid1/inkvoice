import { describe, expect, it } from 'vitest'
import { getChapterProgress } from './getChapterProgress'

describe('getChapterProgress', () => {
  it('returns 0 for all chapters when no progress exists', () => {
    const result = getChapterProgress({
      currentChapter: 0,
      currentParagraph: 0,
      paragraphsPerChapter: [10, 20, 30],
      chapterPositions: {},
    })

    expect(result).toEqual({ 0: 0, 1: 0, 2: 0 })
  })

  it('uses live paragraph position for the current chapter', () => {
    const result = getChapterProgress({
      currentChapter: 1,
      currentParagraph: 5,
      paragraphsPerChapter: [11, 11, 11],
      chapterPositions: {},
    })

    // 5 / (11-1) = 0.5
    expect(result[1]).toBeCloseTo(0.5)
  })

  it('uses saved position for non-current chapters', () => {
    const result = getChapterProgress({
      currentChapter: 2,
      currentParagraph: 0,
      paragraphsPerChapter: [11, 5, 30],
      chapterPositions: { 0: 5, 1: 2 },
    })

    // 5 / (11-1) = 0.5
    expect(result[0]).toBeCloseTo(0.5)
    // 2 / (5-1) = 0.5
    expect(result[1]).toBeCloseTo(0.5)
  })

  it('returns 1.0 for completed chapters (saved at last paragraph)', () => {
    const result = getChapterProgress({
      currentChapter: 2,
      currentParagraph: 0,
      paragraphsPerChapter: [10, 20, 30],
      chapterPositions: { 0: 9 },
    })

    // 9 / (10-1) = 1.0
    expect(result[0]).toBeCloseTo(1.0)
  })

  it('handles chapters with zero paragraphs', () => {
    const result = getChapterProgress({
      currentChapter: 0,
      currentParagraph: 0,
      paragraphsPerChapter: [0, 10],
      chapterPositions: {},
    })

    expect(result[0]).toBe(0)
    expect(result[1]).toBe(0)
  })

  it('clamps progress to 0-1 range', () => {
    const result = getChapterProgress({
      currentChapter: 0,
      currentParagraph: 100,
      paragraphsPerChapter: [10],
      chapterPositions: {},
    })

    expect(result[0]).toBe(1)
  })
})
