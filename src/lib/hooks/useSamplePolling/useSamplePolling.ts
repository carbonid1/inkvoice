'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'

const POLL_INTERVAL = 3000
const POLL_TIMEOUT = 120000

interface UseSamplePollingOptions {
  onSampleReady: (voiceName: string) => void
}

export const useSamplePolling = ({ onSampleReady }: UseSamplePollingOptions) => {
  const timeoutIdsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const onSampleReadyRef = useRef(onSampleReady)

  useEffect(() => {
    onSampleReadyRef.current = onSampleReady
  }, [onSampleReady])

  const startPolling = useCallback((voiceName: string) => {
    // Clear any existing poll for this voice
    const existing = timeoutIdsRef.current.get(voiceName)

    if (existing !== undefined) clearTimeout(existing)

    const startTime = Date.now()

    const poll = () => {
      if (Date.now() - startTime >= POLL_TIMEOUT) {
        timeoutIdsRef.current.delete(voiceName)
        return
      }

      fetch(`/api/voices/${encodeURIComponent(voiceName)}/sample`, { method: 'HEAD' })
        .then(response => {
          if (response.ok) {
            timeoutIdsRef.current.delete(voiceName)
            onSampleReadyRef.current(voiceName)
          } else {
            const id = setTimeout(poll, POLL_INTERVAL)

            timeoutIdsRef.current.set(voiceName, id)
          }
        })
        .catch(() => {
          const id = setTimeout(poll, POLL_INTERVAL)

          timeoutIdsRef.current.set(voiceName, id)
        })
    }

    const id = setTimeout(poll, POLL_INTERVAL)

    timeoutIdsRef.current.set(voiceName, id)
  }, [])

  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current

    return () => {
      timeoutIds.forEach(id => clearTimeout(id))
      timeoutIds.clear()
    }
  }, [])

  return useMemo(() => ({ startPolling }), [startPolling])
}
