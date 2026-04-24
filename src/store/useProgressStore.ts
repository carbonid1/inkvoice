'use client'

import type { Progress } from '@/lib/services/progress/progress.types'
import { create } from 'zustand'

export type { Progress } from '@/lib/services/progress/progress.types'

type ProgressState = {
  progress: Record<string, Progress>
  loaded: boolean
  loadAllProgress: () => Promise<void>
  setProgress: (bookId: string, chapter: number, paragraph: number) => void
  setBookMetadata: (
    bookId: string,
    paragraphsPerChapter: number[],
    wordsPerChapter: number[],
  ) => void
  getProgress: (bookId: string) => Progress
  removeProgress: (bookId: string) => void
  markFinished: (bookId: string) => void
  unmarkFinished: (bookId: string) => void
}

const DEFAULT_PROGRESS: Progress = { chapter: 0, paragraph: 0 }

const DEBOUNCE_MS = 2000

const pendingWrites = new Map<string, ReturnType<typeof setTimeout>>()

const saveToApi = (bookId: string, data: Progress) => {
  fetch(`/api/progress/${bookId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(error => console.error('Failed to save progress:', error))
}

const debouncedSave = (bookId: string, getData: () => Progress | undefined) => {
  const existing = pendingWrites.get(bookId)
  if (existing) clearTimeout(existing)

  pendingWrites.set(
    bookId,
    setTimeout(() => {
      pendingWrites.delete(bookId)
      const data = getData()
      if (data) saveToApi(bookId, data)
    }, DEBOUNCE_MS),
  )
}

const flushPendingWrites = () => {
  pendingWrites.forEach((timeout, bookId) => {
    clearTimeout(timeout)
    const data = useProgressStore.getState().progress[bookId]
    if (data) {
      fetch(`/api/progress/${bookId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true,
      }).catch(() => {})
    }
  })
  pendingWrites.clear()
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushPendingWrites)
}

export const useProgressStore = create<ProgressState>()((set, get) => ({
  progress: {},
  loaded: false,

  loadAllProgress: async () => {
    if (get().loaded) return

    try {
      const response = await fetch('/api/progress')
      const data: Record<string, Progress> = await response.json()
      set({ progress: data, loaded: true })
    } catch (error) {
      console.error('Failed to load progress:', error)
      set({ loaded: true })
    }
  },

  setProgress: (bookId, chapter, paragraph) => {
    set(state => {
      const existing = state.progress[bookId]
      return {
        progress: {
          ...state.progress,
          [bookId]: {
            ...existing,
            chapter,
            paragraph,
            lastReadAt: Date.now(),
            chapterPositions: {
              ...existing?.chapterPositions,
              [chapter]: paragraph,
            },
          },
        },
      }
    })
    debouncedSave(bookId, () => get().progress[bookId])
  },

  setBookMetadata: (bookId, paragraphsPerChapter, wordsPerChapter) => {
    set(state => ({
      progress: {
        ...state.progress,
        [bookId]: {
          ...(state.progress[bookId] || DEFAULT_PROGRESS),
          paragraphsPerChapter,
          wordsPerChapter,
        },
      },
    }))
    debouncedSave(bookId, () => get().progress[bookId])
  },

  getProgress: bookId => {
    return get().progress[bookId] || DEFAULT_PROGRESS
  },

  removeProgress: bookId => {
    // Cancel any pending debounced write
    const pending = pendingWrites.get(bookId)
    if (pending) {
      clearTimeout(pending)
      pendingWrites.delete(bookId)
    }

    set(state => {
      const { [bookId]: _, ...rest } = state.progress
      return { progress: rest }
    })

    fetch(`/api/progress/${bookId}`, { method: 'DELETE' }).catch(error =>
      console.error('Failed to delete progress:', error),
    )
  },

  markFinished: bookId => {
    set(state => ({
      progress: {
        ...state.progress,
        [bookId]: {
          ...(state.progress[bookId] || DEFAULT_PROGRESS),
          finishedAt: Date.now(),
        },
      },
    }))
    debouncedSave(bookId, () => get().progress[bookId])
  },

  unmarkFinished: bookId => {
    set(state => {
      const existing = state.progress[bookId]
      if (!existing) return state
      return {
        progress: {
          ...state.progress,
          [bookId]: { ...existing, finishedAt: null },
        },
      }
    })
    debouncedSave(bookId, () => get().progress[bookId])
  },
}))
