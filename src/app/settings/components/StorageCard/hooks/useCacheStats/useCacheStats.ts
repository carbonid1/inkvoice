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
    fetchStats()
  }, [fetchStats])

  return useMemo(() => ({ stats, loading, refetch: fetchStats }), [stats, loading, fetchStats])
}
