import { describe, expect, it } from 'vitest'
import { seedBook } from '../../../../tests/integration/helpers/seedBook/seedBook'
import { progressService } from './progress.service'

describe('progressService (integration)', () => {
  it('roundtrips arrays and objects through JSON serialization', async () => {
    await seedBook()

    await progressService.upsert('book-1', {
      chapter: 1,
      paragraph: 3,
      paragraphsPerChapter: [10, 20, 30],
      wordsPerChapter: [100, 200, 300],
      lastReadAt: 3000,
      chapterPositions: { 0: 5, 1: 3 },
    })

    const result = await progressService.get('book-1')

    expect(result).toEqual({
      chapter: 1,
      paragraph: 3,
      paragraphsPerChapter: [10, 20, 30],
      wordsPerChapter: [100, 200, 300],
      lastReadAt: 3000,
      chapterPositions: { 0: 5, 1: 3 },
    })
  })

  it('omits optional fields that were never set', async () => {
    await seedBook()

    await progressService.upsert('book-1', { chapter: 0, paragraph: 0 })

    const result = await progressService.get('book-1')

    expect(result).toEqual({ chapter: 0, paragraph: 0 })
  })

  it('getAll returns a record keyed by bookId', async () => {
    await Promise.all([seedBook('book-a'), seedBook('book-b')])

    await progressService.upsert('book-a', { chapter: 2, paragraph: 5, lastReadAt: 1000 })
    await progressService.upsert('book-b', { chapter: 0, paragraph: 0 })

    const result = await progressService.getAll()

    expect(result).toEqual({
      'book-a': { chapter: 2, paragraph: 5, lastReadAt: 1000 },
      'book-b': { chapter: 0, paragraph: 0 },
    })
  })

  it('returns false when removing progress that does not exist', async () => {
    expect(await progressService.remove('unknown')).toBe(false)
  })
})
