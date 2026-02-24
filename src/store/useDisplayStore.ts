'use client'

import type { ChunkingMode } from '@/lib/types/book'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { createDebouncedStorage } from './debouncedStorage'

type ProgressDisplay = 'bar' | 'pages' | 'both'

type DisplayState = {
  progressDisplay: ProgressDisplay
  setProgressDisplay: (mode: ProgressDisplay) => void
  chunkingMode: ChunkingMode
  setChunkingMode: (mode: ChunkingMode) => void
}

type PersistedDisplayState = Pick<DisplayState, 'progressDisplay' | 'chunkingMode'>

export const useDisplayStore = create<DisplayState>()(
  persist(
    set => ({
      progressDisplay: 'both',
      setProgressDisplay: progressDisplay => set({ progressDisplay }),
      chunkingMode: 'sentence' as ChunkingMode,
      setChunkingMode: chunkingMode => set({ chunkingMode }),
    }),
    {
      name: 'inkvoice-display',
      version: 2,
      storage: createJSONStorage<PersistedDisplayState>(() => createDebouncedStorage()),
      partialize: state => ({
        progressDisplay: state.progressDisplay,
        chunkingMode: state.chunkingMode,
      }),
      migrate: (persisted, version) => {
        if (version < 2) {
          return { ...(persisted as PersistedDisplayState), chunkingMode: 'sentence' as const }
        }
        return persisted as PersistedDisplayState
      },
    },
  ),
)
