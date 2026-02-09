'use client'

import type { TTSModel } from '@/lib/services/tts/tts.types'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { createDebouncedStorage } from './debouncedStorage'

type DefaultVoices = Record<TTSModel, string>

const DEFAULT_VOICES: DefaultVoices = {
  'chatterbox-turbo': 'narrator',
  'chatterbox': 'narrator',
  'kokoro': 'af_heart',
}

type VoiceState = {
  voice: string
  model: TTSModel
  setVoice: (voice: string) => void
  setModel: (model: TTSModel) => void
}

type PersistedVoiceState = Pick<VoiceState, 'voice' | 'model'>

export const useVoiceStore = create<VoiceState>()(
  persist(
    (set) => ({
      voice: 'narrator',
      model: 'chatterbox-turbo',
      setVoice: (voice) => set({ voice }),
      setModel: (model) => set({ model, voice: DEFAULT_VOICES[model] }),
    }),
    {
      name: 'inkvoice-voice',
      version: 2,
      storage: createJSONStorage<PersistedVoiceState>(
        () => createDebouncedStorage(),
      ),
      migrate: (_persisted, version) => {
        if (version <= 1) {
          const old = _persisted as { voice?: string } | null
          return {
            voice: old?.voice ?? 'narrator',
            model: 'chatterbox-turbo' as TTSModel,
          }
        }
        return { voice: 'narrator', model: 'chatterbox-turbo' as TTSModel }
      },
      partialize: (state) => ({ voice: state.voice, model: state.model }),
    },
  ),
)
