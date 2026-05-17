'use client'

import { create } from 'zustand'
import { SETTINGS_KEYS } from '@/lib/services/settings/settings.keys'

export type OnboardingStepId = 'voice' | 'pregen'

const STEP_IDS: ReadonlyArray<OnboardingStepId> = ['voice', 'pregen']

type ManuallyCompleted = Record<OnboardingStepId, boolean>

const EMPTY_MANUALLY_COMPLETED: ManuallyCompleted = {
  voice: false,
  pregen: false,
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

const parseManuallyCompleted = (raw: unknown): ManuallyCompleted => {
  const result: ManuallyCompleted = { ...EMPTY_MANUALLY_COMPLETED }

  if (!isRecord(raw)) return result
  for (const id of STEP_IDS) {
    const value = raw[id]

    if (typeof value === 'boolean') result[id] = value
  }
  return result
}

interface OnboardingState {
  dismissed: boolean
  manuallyCompleted: ManuallyCompleted
  loaded: boolean
  loadFromApi: () => Promise<void>
  setDismissed: (value: boolean) => void
  markComplete: (id: OnboardingStepId) => void
}

const putSetting = (key: string, value: unknown): void => {
  fetch(`/api/settings/${key}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  }).catch(error => console.error(`Failed to save ${key}:`, error))
}

export const useOnboardingStore = create<OnboardingState>()((set, get) => ({
  dismissed: false,
  manuallyCompleted: EMPTY_MANUALLY_COMPLETED,
  loaded: false,

  loadFromApi: async () => {
    if (get().loaded) return

    try {
      const response = await fetch('/api/settings')

      if (response.ok) {
        const data: unknown = await response.json()

        if (isRecord(data)) {
          const dismissed = data[SETTINGS_KEYS.ONBOARDING_DISMISSED]

          set({
            dismissed: typeof dismissed === 'boolean' ? dismissed : false,
            manuallyCompleted: parseManuallyCompleted(
              data[SETTINGS_KEYS.ONBOARDING_MANUALLY_COMPLETED],
            ),
            loaded: true,
          })
          return
        }
      }
    } catch (error) {
      console.error('Failed to load onboarding settings:', error)
    }
    set({ loaded: true })
  },

  setDismissed: value => {
    if (get().dismissed === value) return
    set({ dismissed: value })
    putSetting(SETTINGS_KEYS.ONBOARDING_DISMISSED, value)
  },

  markComplete: id => {
    if (get().manuallyCompleted[id]) return
    const next = { ...get().manuallyCompleted, [id]: true }

    set({ manuallyCompleted: next })
    putSetting(SETTINGS_KEYS.ONBOARDING_MANUALLY_COMPLETED, next)
  },
}))
