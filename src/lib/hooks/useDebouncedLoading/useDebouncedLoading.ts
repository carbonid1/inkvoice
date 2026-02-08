'use client'

import { useEffect, useState } from 'react'

const LOADING_DELAY_MS = 200

export const useDebouncedLoading = (isLoading: boolean) => {
  const [delayElapsed, setDelayElapsed] = useState(false)

  useEffect(() => {
    if (!isLoading) return
    const timer = setTimeout(() => setDelayElapsed(true), LOADING_DELAY_MS)
    return () => {
      clearTimeout(timer)
      setDelayElapsed(false)
    }
  }, [isLoading])

  return isLoading && delayElapsed
}
