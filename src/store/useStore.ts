'use client'

import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'

export interface Book {
  id: string
  title: string
  author: string
  filename: string
}

export interface Progress {
  chapter: number
  sentence: number
  totalChapters?: number
  sentencesPerChapter?: number[]
  lastReadAt?: number
}

interface AppState {
  books: Book[]
  currentBook: string | null
  progress: Record<string, Progress>
  voice: string
  setBooks: (books: Book[]) => void
  setCurrentBook: (bookId: string | null) => void
  setProgress: (bookId: string, chapter: number, sentence: number) => void
  setBookMetadata: (bookId: string, totalChapters: number, sentencesPerChapter: number[]) => void
  getProgress: (bookId: string) => Progress
  setVoice: (voice: string) => void
}

type PersistedState = Pick<AppState, 'progress' | 'voice'>

// Debounced localStorage wrapper - batches writes to avoid per-sentence disk IO
// Reads go through instantly; only serialization writes are debounced (1s trailing)
const pending = {
  timeout: null as ReturnType<typeof setTimeout> | null,
  key: null as string | null,
  value: null as string | null,
  listenerAdded: false,
}

const flushStorage = () => {
  if (pending.key !== null && pending.value !== null) {
    localStorage.setItem(pending.key, pending.value)
    pending.key = null
    pending.value = null
  }
  if (pending.timeout) {
    clearTimeout(pending.timeout)
    pending.timeout = null
  }
}

const debouncedStorage: StateStorage = {
  getItem: name => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(name)
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') return
    if (!pending.listenerAdded) {
      window.addEventListener('beforeunload', flushStorage)
      pending.listenerAdded = true
    }
    pending.key = name
    pending.value = value
    if (pending.timeout) clearTimeout(pending.timeout)
    pending.timeout = setTimeout(flushStorage, 1000)
  },
  removeItem: name => {
    if (typeof window === 'undefined') return
    flushStorage()
    localStorage.removeItem(name)
  },
}

const DEFAULT_PROGRESS: Progress = { chapter: 0, sentence: 0 }

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      books: [],
      currentBook: null,
      progress: {},
      voice: 'narrator',

      setBooks: books => set({ books }),

      setCurrentBook: bookId => set({ currentBook: bookId }),

      setProgress: (bookId, chapter, sentence) =>
        set(state => ({
          progress: {
            ...state.progress,
            [bookId]: {
              ...state.progress[bookId],
              chapter,
              sentence,
              lastReadAt: Date.now(),
            },
          },
        })),

      setBookMetadata: (bookId, totalChapters, sentencesPerChapter) =>
        set(state => ({
          progress: {
            ...state.progress,
            [bookId]: {
              ...(state.progress[bookId] || DEFAULT_PROGRESS),
              totalChapters,
              sentencesPerChapter,
            },
          },
        })),

      getProgress: bookId => {
        const state = get()
        return state.progress[bookId] || DEFAULT_PROGRESS
      },

      setVoice: voice => set({ voice }),
    }),
    {
      name: 'inkvoice-storage',
      storage: createJSONStorage<PersistedState>(() => debouncedStorage),
      partialize: state => ({
        progress: state.progress,
        voice: state.voice,
      }),
    },
  ),
)

// Hook to wait for Zustand persist rehydration
export const useHydrated = () => {
  const [hydrated, setHydrated] = useState(() => useStore.persist.hasHydrated())

  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true))
    return unsub
  }, [])

  return hydrated
}
