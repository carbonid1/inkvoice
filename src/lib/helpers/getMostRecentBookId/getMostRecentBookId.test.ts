import { describe, expect, it } from 'vitest'
import { getMostRecentBookId } from './getMostRecentBookId'

describe('getMostRecentBookId', () => {
  it('returns null when the library is empty', () => {
    expect(getMostRecentBookId([], {})).toBe(null)
  })

  it('returns the only book when the library has one', () => {
    expect(getMostRecentBookId([{ id: 'solo' }], {})).toBe('solo')
  })

  it('picks the book with the largest lastReadAt', () => {
    const books = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const progress = {
      a: { lastReadAt: 1000 },
      b: { lastReadAt: 3000 },
      c: { lastReadAt: 2000 },
    }

    expect(getMostRecentBookId(books, progress)).toBe('b')
  })

  it('treats missing progress entries as never-read', () => {
    const books = [{ id: 'never' }, { id: 'recent' }]
    const progress = { recent: { lastReadAt: 5 } }

    expect(getMostRecentBookId(books, progress)).toBe('recent')
  })
})
