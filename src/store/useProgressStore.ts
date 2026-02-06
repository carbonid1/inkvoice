'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { createDebouncedStorage } from './debouncedStorage'

export type Progress = {
  chapter: number
  sentence: number
  totalChapters?: number
  sentencesPerChapter?: number[]
  lastReadAt?: number
}

type ProgressState = {
  progress: Record<string, Progress>
  setProgress: (bookId: string, chapter: number, sentence: number) => void
  setBookMetadata: (
    bookId: string,
    totalChapters: number,
    sentencesPerChapter: number[],
  ) => void
  getProgress: (bookId: string) => Progress
}

type PersistedProgressState = Pick<ProgressState, 'progress'>

const DEFAULT_PROGRESS: Progress = { chapter: 0, sentence: 0 }

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: {},

      setProgress: (bookId, chapter, sentence) =>
        set((state) => ({
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
        set((state) => ({
          progress: {
            ...state.progress,
            [bookId]: {
              ...(state.progress[bookId] || DEFAULT_PROGRESS),
              totalChapters,
              sentencesPerChapter,
            },
          },
        })),

      getProgress: (bookId) => {
        return get().progress[bookId] || DEFAULT_PROGRESS
      },
    }),
    {
      name: 'inkvoice-progress',
      version: 1,
      storage: createJSONStorage<PersistedProgressState>(
        () => createDebouncedStorage(),
      ),
      migrate: (_persisted, version) => {
        if (version === 0) {
          const old = localStorage.getItem('inkvoice-storage')
          if (old) {
            const parsed = JSON.parse(old) as {
              state?: { progress?: Record<string, Progress> }
            }
            return { progress: parsed.state?.progress ?? {} }
          }
        }
        return { progress: {} }
      },
      partialize: (state) => ({ progress: state.progress }),
    },
  ),
)
