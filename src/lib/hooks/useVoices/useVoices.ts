'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

export type { VoiceEntry } from '@/lib/services/voice/voice.types'

import type { VoiceEntry } from '@/lib/services/voice/voice.types'

export const useVoices = () => {
  const [voices, setVoices] = useState<VoiceEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchVoices = useCallback(async () => {
    try {
      const response = await fetch('/api/voices', { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setVoices(data)
      }
    } catch (e) {
      console.error('Failed to fetch voices:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await fetch('/api/voices', { cache: 'no-store' })
        if (cancelled || !response.ok) return
        const data = await response.json()
        if (!cancelled) setVoices(data)
      } catch (e) {
        if (!cancelled) console.error('Failed to fetch voices:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return useMemo(() => ({ voices, loading, refetch: fetchVoices }), [voices, loading, fetchVoices])
}
