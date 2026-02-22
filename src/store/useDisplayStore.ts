'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { createDebouncedStorage } from './debouncedStorage'

type ProgressDisplay = 'bar' | 'pages' | 'both'

type DisplayState = {
  progressDisplay: ProgressDisplay
  setProgressDisplay: (mode: ProgressDisplay) => void
}

type PersistedDisplayState = Pick<DisplayState, 'progressDisplay'>

export const useDisplayStore = create<DisplayState>()(
  persist(
    set => ({
      progressDisplay: 'both',
      setProgressDisplay: progressDisplay => set({ progressDisplay }),
    }),
    {
      name: 'inkvoice-display',
      version: 1,
      storage: createJSONStorage<PersistedDisplayState>(() => createDebouncedStorage()),
      partialize: state => ({ progressDisplay: state.progressDisplay }),
    },
  ),
)
