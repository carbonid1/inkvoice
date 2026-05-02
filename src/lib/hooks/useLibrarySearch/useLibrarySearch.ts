import Fuse, { type IFuseOptions } from 'fuse.js'
import { useMemo } from 'react'
import type { Book } from '@/lib/types/book'

interface UseLibrarySearchArgs {
  books: Book[]
  query: string
}

const FUSE_OPTIONS: IFuseOptions<Book> = {
  keys: [
    { name: 'title', weight: 0.7 },
    { name: 'author', weight: 0.3 },
  ],
  // 0.3 keeps single-typo tolerance ("tolkein" → "tolkien") without matching
  // unrelated titles on letter-overlap noise. minMatchCharLength: 2 prevents
  // single-char queries from returning everything.
  threshold: 0.3,
  ignoreLocation: true,
  minMatchCharLength: 2,
}

// Returns the input list unchanged when the query is empty (preserving caller-
// side sort, e.g. lastReadAt desc) and Fuse-ranked matches when it's non-empty.
export const useLibrarySearch = ({ books, query }: UseLibrarySearchArgs): Book[] => {
  const fuse = useMemo(() => new Fuse(books, FUSE_OPTIONS), [books])

  return useMemo(() => {
    const trimmed = query.trim()

    if (trimmed === '') return books
    return fuse.search(trimmed).map(result => result.item)
  }, [books, fuse, query])
}
