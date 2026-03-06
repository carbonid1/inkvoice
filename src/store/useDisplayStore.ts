'use client'

import type { ChunkingMode } from '@/lib/types/book'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { createDebouncedStorage } from './debouncedStorage'

type DisplayState = {
  chunkingMode: ChunkingMode
  setChunkingMode: (mode: ChunkingMode) => void
}

type PersistedDisplayState = Pick<DisplayState, 'chunkingMode'>

export const useDisplayStore = create<DisplayState>()(
  persist(
    set => ({
      chunkingMode: 'sentence' as ChunkingMode,
      setChunkingMode: chunkingMode => set({ chunkingMode }),
    }),
    {
      name: 'inkvoice-display',
      version: 3,
      storage: createJSONStorage<PersistedDisplayState>(() => createDebouncedStorage()),
      partialize: state => ({
        chunkingMode: state.chunkingMode,
      }),
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>
        if (version < 2) {
          return { ...state, chunkingMode: 'sentence' as const }
        }
        if (version < 3) {
          const { progressDisplay: _, ...rest } = state
          return rest as PersistedDisplayState
        }
        return state as PersistedDisplayState
      },
    },
  ),
)
