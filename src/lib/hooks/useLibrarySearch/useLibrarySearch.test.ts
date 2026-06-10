import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Book } from '@/lib/types/book'
import { useLibrarySearch } from './useLibrarySearch'

const book = (id: string, title: string, author: string): Book => ({
  id,
  title,
  author,
  filename: `${id}.epub`,
})

const LIBRARY: Book[] = [
  book('hound', 'The Hound of the Baskervilles', 'Arthur Conan Doyle'),
  book('alice', "Alice's Adventures in Wonderland", 'Lewis Carroll'),
  book('monte-cristo', 'The Count of Monte Cristo', 'Alexandre Dumas'),
  book('dolls-house', "A Doll's House", 'Henrik Ibsen'),
  book('portrait', 'A Portrait of the Artist as a Young Man', 'James Joyce'),
  book('modest-proposal', 'A Modest Proposal', 'Jonathan Swift'),
  book('frankenstein', 'Frankenstein', 'Mary Wollstonecraft Shelley'),
  book('hobbit', 'The Hobbit', 'J. R. R. Tolkien'),
]

const searchTitles = (query: string): string[] => {
  const { result } = renderHook(() => useLibrarySearch({ books: LIBRARY, query }))

  return result.current.map(b => b.title)
}

describe('useLibrarySearch', () => {
  it('returns the input list unchanged for an empty query', () => {
    expect(searchTitles('')).toEqual(LIBRARY.map(b => b.title))
  })

  it('matches a word query only against titles containing it', () => {
    expect(searchTitles('hound')).toEqual(['The Hound of the Baskervilles'])
  })

  it('tolerates one typo in a short query', () => {
    expect(searchTitles('may')).toContain('Frankenstein')
  })

  it('tolerates transposed letters in a longer query', () => {
    expect(searchTitles('tolkein')).toEqual(['The Hobbit'])
  })
})
