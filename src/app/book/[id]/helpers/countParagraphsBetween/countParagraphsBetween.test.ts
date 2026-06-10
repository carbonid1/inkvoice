import { describe, expect, it } from 'vitest'
import type { ChapterInfo } from '@/lib/types/book'
import { countParagraphsBetween } from './countParagraphsBetween'

const buildChapters = (paragraphCounts: number[]): ChapterInfo[] =>
  paragraphCounts.map((paragraphCount, index) => ({
    title: `Chapter ${index + 1}`,
    paragraphCount,
    wordCount: paragraphCount * 50,
  }))

describe('countParagraphsBetween', () => {
  it('counts the distance within a single chapter', () => {
    const chapters = buildChapters([40, 60])

    const distance = countParagraphsBetween(
      chapters,
      { chapter: 1, paragraph: 10 },
      { chapter: 1, paragraph: 25 },
    )

    expect(distance).toBe(15)
  })

  it('counts across chapter boundaries', () => {
    const chapters = buildChapters([40, 60, 30])

    const distance = countParagraphsBetween(
      chapters,
      { chapter: 0, paragraph: 30 },
      { chapter: 2, paragraph: 5 },
    )

    expect(distance).toBe(10 + 60 + 5)
  })

  it('is negative when the target position is behind', () => {
    const chapters = buildChapters([40, 60])

    const distance = countParagraphsBetween(
      chapters,
      { chapter: 1, paragraph: 0 },
      { chapter: 0, paragraph: 35 },
    )

    expect(distance).toBe(-5)
  })
})
