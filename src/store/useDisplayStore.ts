'use client'

import { create } from 'zustand'

type FontSize = 'small' | 'medium' | 'large'

interface DisplayState {
  fontSize: FontSize
  loaded: boolean
  loadFromApi: () => Promise<void>
  setFontSize: (size: FontSize) => void
}

const SETTING_KEY = 'display.fontSize'

export const useDisplayStore = create<DisplayState>()((set, get) => ({
  fontSize: 'medium',
  loaded: false,

  loadFromApi: async () => {
    if (get().loaded) return

    try {
      const response = await fetch(`/api/settings/${SETTING_KEY}`)

      if (response.ok) {
        const data: { value: FontSize } = await response.json()

        set({ fontSize: data.value, loaded: true })
        return
      }

      set({ loaded: true })
    } catch (error) {
      console.error('Failed to load display settings:', error)
      set({ loaded: true })
    }
  },

  setFontSize: (size: FontSize) => {
    set({ fontSize: size })
    fetch(`/api/settings/${SETTING_KEY}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: size }),
    }).catch(error => console.error('Failed to save font size:', error))
  },
}))

export type { FontSize }
