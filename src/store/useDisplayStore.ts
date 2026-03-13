'use client'

import { create } from 'zustand'

type FontSize = 'small' | 'medium' | 'large'

type DisplayState = {
  fontSize: FontSize
  loaded: boolean
  loadFromApi: () => Promise<void>
  setFontSize: (size: FontSize) => void
}

const SETTING_KEY = 'display.fontSize'

const migrateFromLocalStorage = async (): Promise<FontSize | null> => {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem('inkvoice-font')
    if (!raw) return null

    const parsed = JSON.parse(raw) as { state?: { fontSize?: string } }
    let fontSize = parsed.state?.fontSize
    if (!fontSize) return null

    // Replicate v2 migration: xlarge → large
    if (fontSize === 'xlarge') fontSize = 'large'

    if (!['small', 'medium', 'large'].includes(fontSize)) return null

    await fetch(`/api/settings/${SETTING_KEY}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: fontSize }),
    })

    return fontSize as FontSize
  } catch {
    return null
  }
}

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

      // Setting not found — try migrating from localStorage
      const migrated = await migrateFromLocalStorage()
      if (migrated) {
        set({ fontSize: migrated, loaded: true })
      } else {
        set({ loaded: true })
      }
    } catch (error) {
      console.error('Failed to load display settings:', error)
      const migrated = await migrateFromLocalStorage()
      if (migrated) {
        set({ fontSize: migrated, loaded: true })
      } else {
        set({ loaded: true })
      }
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
