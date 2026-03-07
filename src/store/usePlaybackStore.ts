'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createDebouncedStorage } from './debouncedStorage'

type PlaybackState = {
  autoAdvanceChapters: boolean
  toggleAutoAdvance: () => void
}

type PersistedPlaybackState = Pick<PlaybackState, 'autoAdvanceChapters'>

export const usePlaybackStore = create<PlaybackState>()(
  persist(
    set => ({
      autoAdvanceChapters: false,
      toggleAutoAdvance: () => set(s => ({ autoAdvanceChapters: !s.autoAdvanceChapters })),
    }),
    {
      name: 'inkvoice-playback',
      version: 1,
      storage: createJSONStorage<PersistedPlaybackState>(() => createDebouncedStorage()),
      partialize: state => ({ autoAdvanceChapters: state.autoAdvanceChapters }),
    },
  ),
)
