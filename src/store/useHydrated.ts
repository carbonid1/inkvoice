'use client'

import { useEffect, useState } from 'react'

import { useDisplayStore } from './useDisplayStore'
import { usePrefetchStore } from './usePrefetchStore'
import { useProgressStore } from './useProgressStore'
import { useVoiceStore } from './useVoiceStore'

const allHydrated = () =>
  useProgressStore.persist.hasHydrated() &&
  useVoiceStore.persist.hasHydrated() &&
  usePrefetchStore.persist.hasHydrated() &&
  useDisplayStore.persist.hasHydrated()

export const useHydrated = () => {
  const [hydrated, setHydrated] = useState(allHydrated)

  useEffect(() => {
    const check = () => {
      if (allHydrated()) setHydrated(true)
    }
    const unsub1 = useProgressStore.persist.onFinishHydration(check)
    const unsub2 = useVoiceStore.persist.onFinishHydration(check)
    const unsub3 = usePrefetchStore.persist.onFinishHydration(check)
    const unsub4 = useDisplayStore.persist.onFinishHydration(check)

    // Clean up legacy storage keys after migration
    if (typeof window !== 'undefined') {
      localStorage.removeItem('inkvoice-storage')
      localStorage.removeItem('inkvoice-display')
      localStorage.removeItem('inkvoice-playback')
      localStorage.removeItem('inkvoice-pronunciation')
    }

    return () => {
      unsub1()
      unsub2()
      unsub3()
      unsub4()
    }
  }, [])

  return hydrated
}
