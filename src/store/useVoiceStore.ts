'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { createDebouncedStorage } from './debouncedStorage'

type VoiceState = {
  voice: string
  setVoice: (voice: string) => void
}

type PersistedVoiceState = Pick<VoiceState, 'voice'>

export const useVoiceStore = create<VoiceState>()(
  persist(
    (set) => ({
      voice: 'narrator',
      setVoice: (voice) => set({ voice }),
    }),
    {
      name: 'inkvoice-voice',
      version: 3,
      storage: createJSONStorage<PersistedVoiceState>(
        () => createDebouncedStorage(),
      ),
      migrate: () => {
        return { voice: 'narrator' }
      },
      partialize: (state) => ({ voice: state.voice }),
    },
  ),
)
