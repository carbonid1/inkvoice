'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { createDebouncedStorage } from './debouncedStorage'

type VoiceState = {
  voice: string
  bookVoices: Record<string, string>
  setVoice: (voice: string) => void
  setBookVoice: (bookId: string, voice: string) => void
  clearBookVoice: (bookId: string) => void
}

type PersistedVoiceState = Pick<VoiceState, 'voice' | 'bookVoices'>

export const useVoiceStore = create<VoiceState>()(
  persist(
    set => ({
      voice: 'narrator',
      bookVoices: {},
      setVoice: voice => set({ voice }),
      setBookVoice: (bookId, voice) =>
        set(state => ({ bookVoices: { ...state.bookVoices, [bookId]: voice } })),
      clearBookVoice: bookId =>
        set(state => {
          const { [bookId]: _, ...rest } = state.bookVoices
          return { bookVoices: rest }
        }),
    }),
    {
      name: 'inkvoice-voice',
      version: 4,
      storage: createJSONStorage<PersistedVoiceState>(() => createDebouncedStorage()),
      migrate: () => {
        return { voice: 'narrator', bookVoices: {} }
      },
      partialize: state => ({ voice: state.voice, bookVoices: state.bookVoices }),
    },
  ),
)
