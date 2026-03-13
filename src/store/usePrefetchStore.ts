'use client'

import { create } from 'zustand'

type PrefetchState = {
  enabled: boolean
  loaded: boolean
  loadFromApi: () => Promise<void>
  toggle: () => void
}

const SETTING_KEY = 'prefetch.enabled'

const migrateFromLocalStorage = async (): Promise<boolean | null> => {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem('inkvoice-prefetch')
    if (!raw) return null

    const parsed = JSON.parse(raw) as { state?: { enabled?: boolean } }
    const enabled = parsed.state?.enabled
    if (typeof enabled !== 'boolean') return null

    await fetch(`/api/settings/${SETTING_KEY}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: enabled }),
    })

    return enabled
  } catch {
    return null
  }
}

export const usePrefetchStore = create<PrefetchState>()((set, get) => ({
  enabled: true,
  loaded: false,

  loadFromApi: async () => {
    if (get().loaded) return

    try {
      const response = await fetch(`/api/settings/${SETTING_KEY}`)

      if (response.ok) {
        const data: { value: boolean } = await response.json()
        set({ enabled: data.value, loaded: true })
        return
      }

      // Setting not found — try migrating from localStorage
      const migrated = await migrateFromLocalStorage()
      if (migrated !== null) {
        set({ enabled: migrated, loaded: true })
      } else {
        set({ loaded: true })
      }
    } catch (error) {
      console.error('Failed to load prefetch settings:', error)
      const migrated = await migrateFromLocalStorage()
      if (migrated !== null) {
        set({ enabled: migrated, loaded: true })
      } else {
        set({ loaded: true })
      }
    }
  },

  toggle: () => {
    const newValue = !get().enabled
    set({ enabled: newValue })
    fetch(`/api/settings/${SETTING_KEY}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: newValue }),
    }).catch(error => console.error('Failed to save prefetch setting:', error))
  },
}))
