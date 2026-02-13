'use client'

import { useEffect, useMemo, useRef } from 'react'

export const useFetchLifecycle = () => {
  const mountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController>(new AbortController())
  const inFlightRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    mountedRef.current = true
    const controller = new AbortController()
    abortControllerRef.current = controller
    const inFlight = inFlightRef.current
    return () => {
      mountedRef.current = false
      controller.abort()
      inFlight.clear()
    }
  }, [])

  return useMemo(() => ({ mountedRef, abortControllerRef, inFlightRef }), [])
}
