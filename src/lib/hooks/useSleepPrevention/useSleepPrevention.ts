'use client'

import { useEffect, useRef } from 'react'
import type { PregenJobStatus } from '@/lib/services/pregenQueue/pregenQueue.types'
import { usePregenStore } from '@/store/usePregenStore'

const ACTIVE_STATUSES: Set<PregenJobStatus> = new Set(['queued', 'in_progress'])

const selectHasActiveJobs = (s: { jobs: Record<string, { status: PregenJobStatus }> }): boolean =>
  Object.values(s.jobs).some(job => ACTIVE_STATUSES.has(job.status))

export const useSleepPrevention = (): void => {
  const hasActiveJobs = usePregenStore(selectHasActiveJobs)
  const isBlockingRef = useRef(false)

  useEffect(() => {
    const bridge = window.inkvoice

    if (!bridge) return

    if (hasActiveJobs && !isBlockingRef.current) {
      bridge.sleepBlockStart()
      isBlockingRef.current = true
    } else if (!hasActiveJobs && isBlockingRef.current) {
      bridge.sleepBlockStop()
      isBlockingRef.current = false
    }

    return () => {
      if (isBlockingRef.current) {
        bridge.sleepBlockStop()
        isBlockingRef.current = false
      }
    }
  }, [hasActiveJobs])
}
