'use client'

import { create } from 'zustand'
import type { Book } from '@/lib/types/book'

export interface LibraryState {
  books: Book[]
  /** True once a load attempt has settled (success or failure). */
  loaded: boolean
  fetching: boolean
  error: string | null
  currentBook: string | null
  setBooks: (books: Book[]) => void
  setCurrentBook: (bookId: string | null) => void
  addBooks: (books: Book[]) => void
  /** Fetch the library once; no-op when a previous attempt already settled or one is in flight. */
  loadBooks: () => Promise<void>
  /** Always re-fetch (deduped while in flight) — /api/books also syncs the DB with the books folder. */
  refreshBooks: () => Promise<void>
}

export const useLibraryStore = create<LibraryState>()((set, get) => ({
  books: [],
  loaded: false,
  fetching: false,
  error: null,
  currentBook: null,
  setBooks: books => set({ books, loaded: true }),
  setCurrentBook: bookId => set({ currentBook: bookId }),
  addBooks: books =>
    set(state => {
      const newIds = new Set(books.map(b => b.id))

      return { books: [...state.books.filter(b => !newIds.has(b.id)), ...books] }
    }),

  loadBooks: async () => {
    if (get().loaded || get().fetching) return
    await get().refreshBooks()
  },

  refreshBooks: async () => {
    if (get().fetching) return
    set({ fetching: true })
    try {
      const response = await fetch('/api/books')

      if (!response.ok) throw new Error('Failed to fetch books')
      const books: Book[] = await response.json()

      set({ books, loaded: true, error: null })
    } catch (e) {
      // loaded flips true on failure too: "settled" is what consumers gate
      // skeletons and one-shot fills on, not "succeeded".
      set({ loaded: true, error: e instanceof Error ? e.message : 'Unknown error' })
    } finally {
      set({ fetching: false })
    }
  },
}))
