'use client'

import type { Progress } from '@/lib/services/progress/progress.types'
import { create } from 'zustand'

export type { Progress } from '@/lib/services/progress/progress.types'

type ProgressState = {
  progress: Record<string, Progress>
  loaded: boolean
  loadAllProgress: () => Promise<void>
  setProgress: (bookId: string, chapter: number, sentence: number) => void
  setBookMetadata: (
    bookId: string,
    totalChapters: number,
    sentencesPerChapter: number[],
    wordsPerChapter: number[],
  ) => void
  getProgress: (bookId: string) => Progress
  removeProgress: (bookId: string) => void
}

const DEFAULT_PROGRESS: Progress = { chapter: 0, sentence: 0 }

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

const migrateFromLocalStorage = async (): Promise<Record<string, Progress> | null> => {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem('inkvoice-progress')
    if (!raw) return null

    const parsed = JSON.parse(raw) as {
      state?: { progress?: Record<string, Progress> }
    }
    const progress = parsed.state?.progress
    if (!progress || Object.keys(progress).length === 0) return null

    // Seed DB with localStorage data
    await Promise.all(
      Object.entries(progress).map(([bookId, data]) =>
        fetch(`/api/progress/${bookId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
      ),
    )

    return progress
  } catch {
    return null
  }
}

export const useProgressStore = create<ProgressState>()((set, get) => ({
  progress: {},
  loaded: false,

  loadAllProgress: async () => {
    if (get().loaded) return

    try {
      const response = await fetch('/api/progress')
      const data: Record<string, Progress> = await response.json()

      if (Object.keys(data).length > 0) {
        set({ progress: data, loaded: true })
        return
      }

      // DB empty — try migrating from localStorage
      const migrated = await migrateFromLocalStorage()
      set({ progress: migrated ?? {}, loaded: true })
    } catch (error) {
      console.error('Failed to load progress:', error)
      // Fall back to localStorage if API fails
      const migrated = await migrateFromLocalStorage()
      set({ progress: migrated ?? {}, loaded: true })
    }
  },

  setProgress: (bookId, chapter, sentence) => {
    set(state => {
      const existing = state.progress[bookId]
      return {
        progress: {
          ...state.progress,
          [bookId]: {
            ...existing,
            chapter,
            sentence,
            lastReadAt: Date.now(),
            chapterPositions: {
              ...existing?.chapterPositions,
              [chapter]: sentence,
            },
          },
        },
      }
    })
    debouncedSave(bookId, () => get().progress[bookId])
  },

  setBookMetadata: (bookId, totalChapters, sentencesPerChapter, wordsPerChapter) => {
    set(state => ({
      progress: {
        ...state.progress,
        [bookId]: {
          ...(state.progress[bookId] || DEFAULT_PROGRESS),
          totalChapters,
          sentencesPerChapter,
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
}))
