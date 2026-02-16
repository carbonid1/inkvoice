'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createDebouncedStorage } from './debouncedStorage'

type PrefetchState = {
  enabled: boolean
  toggle: () => void
}

type PersistedPrefetchState = Pick<PrefetchState, 'enabled'>

export const usePrefetchStore = create<PrefetchState>()(
  persist(
    (set) => ({
      enabled: true,
      toggle: () => set((s) => ({ enabled: !s.enabled })),
    }),
    {
      name: 'inkvoice-prefetch',
      version: 1,
      storage: createJSONStorage<PersistedPrefetchState>(
        () => createDebouncedStorage(),
      ),
      partialize: (state) => ({ enabled: state.enabled }),
    },
  ),
)
