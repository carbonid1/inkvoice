'use client'

import { useEffect, useMemo, useState } from 'react'

export type VoiceEntry = {
  name: string
  hasSample: boolean
}

export const useVoices = () => {
  const [voices, setVoices] = useState<VoiceEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVoices = async () => {
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
    }

    fetchVoices()
  }, [])

  return useMemo(() => ({ voices, loading }), [voices, loading])
}
