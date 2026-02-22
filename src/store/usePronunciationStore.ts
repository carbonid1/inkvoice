'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { createDebouncedStorage } from './debouncedStorage'

type PronunciationState = {
  version: number
  bumpVersion: () => void
}

type PersistedPronunciationState = Pick<PronunciationState, 'version'>

export const usePronunciationStore = create<PronunciationState>()(
  persist(
    set => ({
      version: 0,
      bumpVersion: () => set(s => ({ version: s.version + 1 })),
    }),
    {
      name: 'inkvoice-pronunciation',
      version: 1,
      storage: createJSONStorage<PersistedPronunciationState>(() => createDebouncedStorage()),
      partialize: state => ({ version: state.version }),
    },
  ),
)
