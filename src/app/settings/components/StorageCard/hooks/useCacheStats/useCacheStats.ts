'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CacheStatsResponse } from './useCacheStats.types'

export const useCacheStats = () => {
  const [stats, setStats] = useState<CacheStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/cache/stats')

      if (response.ok) {
        const data = await response.json()

        setStats(data)
      }
    } catch {
      // Fetch failed — keep current state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await fetch('/api/cache/stats')

        if (cancelled || !response.ok) return
        const data = await response.json()

        if (!cancelled) setStats(data)
      } catch {
        // Fetch failed — keep current state
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return useMemo(() => ({ stats, loading, refetch: fetchStats }), [stats, loading, fetchStats])
}
