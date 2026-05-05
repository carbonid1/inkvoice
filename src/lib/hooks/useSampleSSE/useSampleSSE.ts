'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { VoiceSampleEvent } from '@/lib/services/voiceSampleEvents/voiceSampleEvents.types'

interface UseSampleSSEOptions {
  onSampleReady: (voiceName: string) => void
  onSampleFailed?: (voiceName: string) => void
}

export const useSampleSSE = ({ onSampleReady, onSampleFailed }: UseSampleSSEOptions) => {
  const onSampleReadyRef = useRef(onSampleReady)
  const onSampleFailedRef = useRef(onSampleFailed)
  const pendingRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    onSampleReadyRef.current = onSampleReady
    onSampleFailedRef.current = onSampleFailed
  }, [onSampleReady, onSampleFailed])

  const startListening = useCallback((voiceName: string) => {
    pendingRef.current.add(voiceName)
  }, [])

  useEffect(() => {
    const eventSource = new EventSource('/api/voices/sample-events')

    eventSource.addEventListener('sample', (e: MessageEvent) => {
      const event: VoiceSampleEvent = JSON.parse(e.data)

      if (!pendingRef.current.has(event.voiceName)) return
      pendingRef.current.delete(event.voiceName)
      if (event.status === 'ready') onSampleReadyRef.current(event.voiceName)
      else if (event.status === 'failed') onSampleFailedRef.current?.(event.voiceName)
    })

    return () => eventSource.close()
  }, [])

  return useMemo(() => ({ startListening }), [startListening])
}
