'use client'

import { DEFAULT_VOICE } from '@/lib/services/voice/voice.consts'
import { create } from 'zustand'

type VoiceState = {
  voice: string
  bookVoices: Record<string, string>
  loaded: boolean
  loadAll: () => Promise<void>
  setVoice: (voice: string) => void
  setBookVoice: (bookId: string, voice: string) => void
  clearBookVoice: (bookId: string) => void
  clearVoiceFromAllBooks: (voiceName: string) => void
}

const GLOBAL_KEY = '__global__'

const migrateFromLocalStorage = async (): Promise<{
  voice: string
  bookVoices: Record<string, string>
} | null> => {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem('inkvoice-voice')
    if (!raw) return null

    const parsed = JSON.parse(raw) as {
      state?: { voice?: string; bookVoices?: Record<string, string> }
    }
    const voice = parsed.state?.voice
    const bookVoices = parsed.state?.bookVoices

    if (!voice && (!bookVoices || Object.keys(bookVoices).length === 0)) return null

    const data = {
      voice: voice ?? DEFAULT_VOICE,
      bookVoices: bookVoices ?? {},
    }

    // Seed DB with localStorage data
    const promises: Promise<Response>[] = []

    promises.push(
      fetch(`/api/voice-preferences/${GLOBAL_KEY}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceName: data.voice }),
      }),
    )

    for (const [bookId, voiceName] of Object.entries(data.bookVoices)) {
      promises.push(
        fetch(`/api/voice-preferences/${bookId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voiceName }),
        }),
      )
    }

    await Promise.all(promises)
    return data
  } catch {
    return null
  }
}

export const useVoiceStore = create<VoiceState>()((set, get) => ({
  voice: DEFAULT_VOICE,
  bookVoices: {},
  loaded: false,

  loadAll: async () => {
    if (get().loaded) return

    try {
      const response = await fetch('/api/voice-preferences')
      const data: { voice: string; bookVoices: Record<string, string> } = await response.json()

      // Check if DB has data (non-default voice or any book overrides)
      const hasData = data.voice !== DEFAULT_VOICE || Object.keys(data.bookVoices).length > 0

      if (hasData) {
        set({ voice: data.voice, bookVoices: data.bookVoices, loaded: true })
        return
      }

      // DB empty — try migrating from localStorage
      const migrated = await migrateFromLocalStorage()
      if (migrated) {
        set({ voice: migrated.voice, bookVoices: migrated.bookVoices, loaded: true })
      } else {
        set({ loaded: true })
      }
    } catch (error) {
      console.error('Failed to load voice preferences:', error)
      const migrated = await migrateFromLocalStorage()
      if (migrated) {
        set({ voice: migrated.voice, bookVoices: migrated.bookVoices, loaded: true })
      } else {
        set({ loaded: true })
      }
    }
  },

  setVoice: voice => {
    set({ voice })
    fetch(`/api/voice-preferences/${GLOBAL_KEY}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voiceName: voice }),
    }).catch(error => console.error('Failed to save voice preference:', error))
  },

  setBookVoice: (bookId, voice) => {
    set(state => ({ bookVoices: { ...state.bookVoices, [bookId]: voice } }))
    fetch(`/api/voice-preferences/${bookId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voiceName: voice }),
    }).catch(error => console.error('Failed to save book voice preference:', error))
  },

  clearBookVoice: bookId => {
    set(state => {
      const { [bookId]: _, ...rest } = state.bookVoices
      return { bookVoices: rest }
    })
    fetch(`/api/voice-preferences/${bookId}`, { method: 'DELETE' }).catch(error =>
      console.error('Failed to delete book voice preference:', error),
    )
  },

  clearVoiceFromAllBooks: voiceName => {
    const globalWasAffected = get().voice === voiceName
    set(state => {
      const updated = Object.fromEntries(
        Object.entries(state.bookVoices).filter(([, v]) => v !== voiceName),
      )
      return {
        voice: state.voice === voiceName ? DEFAULT_VOICE : state.voice,
        bookVoices: updated,
      }
    })

    fetch(`/api/voice-preferences?voiceName=${encodeURIComponent(voiceName)}`, {
      method: 'DELETE',
    }).catch(error => console.error('Failed to clear voice from all books:', error))

    if (globalWasAffected) {
      fetch(`/api/voice-preferences/${GLOBAL_KEY}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceName: DEFAULT_VOICE }),
      }).catch(error => console.error('Failed to reset global voice:', error))
    }
  },
}))
