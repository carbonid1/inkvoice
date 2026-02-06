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
      version: 1,
      storage: createJSONStorage<PersistedVoiceState>(
        () => createDebouncedStorage(),
      ),
      migrate: (_persisted, version) => {
        if (version === 0) {
          const old = localStorage.getItem('inkvoice-storage')
          if (old) {
            const parsed = JSON.parse(old) as {
              state?: { voice?: string }
            }
            return { voice: parsed.state?.voice ?? 'narrator' }
          }
        }
        return { voice: 'narrator' }
      },
      partialize: (state) => ({ voice: state.voice }),
    },
  ),
)
