'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

export type { VoiceEntry } from '@/lib/services/voice/voice.types'

import type { VoiceEntry } from '@/lib/services/voice/voice.types'

export const useVoices = () => {
  const [voices, setVoices] = useState<VoiceEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchVoices = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/voices')
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
    fetchVoices()
  }, [fetchVoices])

  return useMemo(() => ({ voices, loading, refetch: fetchVoices }), [voices, loading, fetchVoices])
}
