'use client'

import { useEffect, useState } from 'react'

import { useDisplayStore } from './useDisplayStore'
import { useProgressStore } from './useProgressStore'
import { useVoiceStore } from './useVoiceStore'

const allHydrated = () =>
  useProgressStore.getState().loaded &&
  useVoiceStore.getState().loaded &&
  useDisplayStore.getState().loaded

export const useHydrated = () => {
  const [hydrated, setHydrated] = useState(allHydrated)

  useEffect(() => {
    const check = () => {
      if (allHydrated()) setHydrated(true)
    }

    const unsub1 = useProgressStore.subscribe(check)
    const unsub2 = useVoiceStore.subscribe(check)
    const unsub3 = useDisplayStore.subscribe(check)

    // Trigger all API loads
    useProgressStore.getState().loadAllProgress()
    useVoiceStore.getState().loadAll()
    useDisplayStore.getState().loadFromApi()

    check()

    return () => {
      unsub1()
      unsub2()
      unsub3()
    }
  }, [])

  return hydrated
}
