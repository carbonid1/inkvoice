'use client'

import { useEffect, useState } from 'react'

import { useDisplayStore } from './useDisplayStore'
import { usePrefetchStore } from './usePrefetchStore'
import { useProgressStore } from './useProgressStore'
import { useVoiceStore } from './useVoiceStore'

const allHydrated = () =>
  useProgressStore.getState().loaded &&
  useVoiceStore.getState().loaded &&
  usePrefetchStore.getState().loaded &&
  useDisplayStore.getState().loaded

export const useHydrated = () => {
  const [hydrated, setHydrated] = useState(allHydrated)

  useEffect(() => {
    const check = () => {
      if (allHydrated()) setHydrated(true)
    }

    const unsub1 = useProgressStore.subscribe(check)
    const unsub2 = useVoiceStore.subscribe(check)
    const unsub3 = usePrefetchStore.subscribe(check)
    const unsub4 = useDisplayStore.subscribe(check)

    // Trigger all API loads
    useProgressStore.getState().loadAllProgress()
    useVoiceStore.getState().loadAll()
    useDisplayStore.getState().loadFromApi()
    usePrefetchStore.getState().loadFromApi()

    // Clean up legacy storage keys after migration
    if (typeof window !== 'undefined') {
      localStorage.removeItem('inkvoice-storage')
      localStorage.removeItem('inkvoice-display')
      localStorage.removeItem('inkvoice-playback')
      localStorage.removeItem('inkvoice-pronunciation')
    }

    check()

    return () => {
      unsub1()
      unsub2()
      unsub3()
      unsub4()
    }
  }, [])

  return hydrated
}
