'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createDebouncedStorage } from './debouncedStorage'

type FontSize = 'small' | 'medium' | 'large'

type DisplayState = {
  fontSize: FontSize
  setFontSize: (size: FontSize) => void
}

type PersistedDisplayState = Pick<DisplayState, 'fontSize'>

export const useDisplayStore = create<DisplayState>()(
  persist(
    set => ({
      fontSize: 'medium',
      setFontSize: (size: FontSize) => set({ fontSize: size }),
    }),
    {
      name: 'inkvoice-font',
      version: 2,
      storage: createJSONStorage<PersistedDisplayState>(() => createDebouncedStorage()),
      partialize: state => ({ fontSize: state.fontSize }),
      migrate: (persisted, version) => {
        const state = persisted as PersistedDisplayState
        if (version < 2 && state.fontSize === ('xlarge' as FontSize)) {
          return { ...state, fontSize: 'large' as FontSize }
        }
        return state
      },
    },
  ),
)

export type { FontSize }
