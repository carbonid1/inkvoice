'use client'

import type { Book } from '@/lib/types/book'
import { create } from 'zustand'

export type LibraryState = {
  books: Book[]
  currentBook: string | null
  setBooks: (books: Book[]) => void
  setCurrentBook: (bookId: string | null) => void
}

export const useLibraryStore = create<LibraryState>()((set) => ({
  books: [],
  currentBook: null,
  setBooks: (books) => set({ books }),
  setCurrentBook: (bookId) => set({ currentBook: bookId }),
}))
