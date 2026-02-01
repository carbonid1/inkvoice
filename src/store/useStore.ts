'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Book {
  id: string
  title: string
  author: string
  filename: string
}

export interface Progress {
  chapter: number
  sentence: number
}

interface AppState {
  books: Book[]
  currentBook: string | null
  progress: Record<string, Progress>
  voice: string
  setBooks: (books: Book[]) => void
  setCurrentBook: (bookId: string | null) => void
  setProgress: (bookId: string, chapter: number, sentence: number) => void
  getProgress: (bookId: string) => Progress
  setVoice: (voice: string) => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      books: [],
      currentBook: null,
      progress: {},
      voice: 'narrator',

      setBooks: (books) => set({ books }),

      setCurrentBook: (bookId) => set({ currentBook: bookId }),

      setProgress: (bookId, chapter, sentence) =>
        set((state) => ({
          progress: {
            ...state.progress,
            [bookId]: { chapter, sentence },
          },
        })),

      getProgress: (bookId) => {
        const state = get()
        return state.progress[bookId] || { chapter: 0, sentence: 0 }
      },

      setVoice: (voice) => set({ voice }),
    }),
    {
      name: 'inkvoice-storage',
      partialize: (state) => ({
        progress: state.progress,
        voice: state.voice,
      }),
    }
  )
)
