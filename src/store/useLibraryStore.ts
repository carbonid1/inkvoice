'use client'

import { create } from 'zustand'
import type { Book } from '@/lib/types/book'

export interface LibraryState {
  books: Book[]
  currentBook: string | null
  setBooks: (books: Book[]) => void
  setCurrentBook: (bookId: string | null) => void
  addBooks: (books: Book[]) => void
}

export const useLibraryStore = create<LibraryState>()(set => ({
  books: [],
  currentBook: null,
  setBooks: books => set({ books }),
  setCurrentBook: bookId => set({ currentBook: bookId }),
  addBooks: books =>
    set(state => {
      const newIds = new Set(books.map(b => b.id))

      return { books: [...state.books.filter(b => !newIds.has(b.id)), ...books] }
    }),
}))
