'use client'

import { useEffect, useState } from 'react'

import { useProgressStore } from './useProgressStore'
import { useVoiceStore } from './useVoiceStore'

const bothHydrated = () =>
  useProgressStore.persist.hasHydrated() &&
  useVoiceStore.persist.hasHydrated()

export const useHydrated = () => {
  const [hydrated, setHydrated] = useState(bothHydrated)

  useEffect(() => {
    const check = () => {
      if (bothHydrated()) setHydrated(true)
    }
    const unsub1 = useProgressStore.persist.onFinishHydration(check)
    const unsub2 = useVoiceStore.persist.onFinishHydration(check)

    // Clean up legacy unified storage key after migration
    if (typeof window !== 'undefined' && localStorage.getItem('inkvoice-storage')) {
      localStorage.removeItem('inkvoice-storage')
    }

    return () => {
      unsub1()
      unsub2()
    }
  }, [])

  return hydrated
}
