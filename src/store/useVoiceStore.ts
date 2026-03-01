'use client'

import { DEFAULT_VOICE } from '@/lib/services/voice/voice.consts'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { createDebouncedStorage } from './debouncedStorage'

type VoiceState = {
  voice: string
  bookVoices: Record<string, string>
  setVoice: (voice: string) => void
  setBookVoice: (bookId: string, voice: string) => void
  clearBookVoice: (bookId: string) => void
  clearVoiceFromAllBooks: (voiceName: string) => void
}

type PersistedVoiceState = Pick<VoiceState, 'voice' | 'bookVoices'>

export const useVoiceStore = create<VoiceState>()(
  persist(
    set => ({
      voice: DEFAULT_VOICE,
      bookVoices: {},
      setVoice: voice => set({ voice }),
      setBookVoice: (bookId, voice) =>
        set(state => ({ bookVoices: { ...state.bookVoices, [bookId]: voice } })),
      clearBookVoice: bookId =>
        set(state => {
          const { [bookId]: _, ...rest } = state.bookVoices
          return { bookVoices: rest }
        }),
      clearVoiceFromAllBooks: voiceName =>
        set(state => {
          const updated = Object.fromEntries(
            Object.entries(state.bookVoices).filter(([, v]) => v !== voiceName),
          )
          return {
            voice: state.voice === voiceName ? DEFAULT_VOICE : state.voice,
            bookVoices: updated,
          }
        }),
    }),
    {
      name: 'inkvoice-voice',
      version: 5,
      storage: createJSONStorage<PersistedVoiceState>(() => createDebouncedStorage()),
      migrate: () => {
        return { voice: DEFAULT_VOICE, bookVoices: {} }
      },
      partialize: state => ({ voice: state.voice, bookVoices: state.bookVoices }),
    },
  ),
)
