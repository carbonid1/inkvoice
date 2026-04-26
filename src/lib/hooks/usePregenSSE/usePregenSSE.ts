'use client'

import { useEffect } from 'react'
import type { PregenJob } from '@/lib/services/pregenQueue/pregenQueue.types'
import { usePregenStore } from '@/store/usePregenStore'

const refetchEstimate = async (bookId: string) => {
  try {
    const response = await fetch(`/api/pregenerate/estimate/${bookId}`)

    if (!response.ok) return
    const data = await response.json()

    usePregenStore.getState().updateEstimate(bookId, {
      totalParagraphs: data.totalParagraphs,
      cachedParagraphs: data.cachedParagraphs,
      estimatedSizeBytes: data.estimatedSizeBytes,
      estimatedGenerationMinutes: data.estimatedGenerationMinutes,
      budget: data.budget,
    })
  } catch {
    // Estimate refresh is best-effort
  }
}

export const usePregenSSE = () => {
  const setJobs = usePregenStore(s => s.setJobs)
  const updateJob = usePregenStore(s => s.updateJob)
  const removeJob = usePregenStore(s => s.removeJob)
  const setSamplingRate = usePregenStore(s => s.setSamplingRate)
  const setWarmingUp = usePregenStore(s => s.setWarmingUp)

  useEffect(() => {
    const eventSource = new EventSource('/api/pregenerate/events')

    eventSource.addEventListener('snapshot', (e: MessageEvent) => {
      const jobs: PregenJob[] = JSON.parse(e.data)

      setJobs(jobs)
    })

    eventSource.addEventListener('update', (e: MessageEvent) => {
      const data: { type: 'update'; job: PregenJob; samplingRate?: number } = JSON.parse(e.data)

      updateJob(data.job)
      if (data.samplingRate !== undefined) {
        setSamplingRate(data.job.bookId, data.samplingRate)
      }
    })

    eventSource.addEventListener('deleted', (e: MessageEvent) => {
      const data: { type: 'deleted'; bookId: string } = JSON.parse(e.data)

      removeJob(data.bookId)
      refetchEstimate(data.bookId)
    })

    eventSource.addEventListener('warmup_start', (e: MessageEvent) => {
      const data: { type: 'warmup_start'; bookId: string } = JSON.parse(e.data)

      setWarmingUp(data.bookId)
    })

    eventSource.addEventListener('warmup_complete', () => {
      setWarmingUp(null)
    })

    eventSource.onerror = () => {
      if (usePregenStore.getState().loaded) {
        usePregenStore.setState({ loaded: false })
      }
      setWarmingUp(null)
    }

    return () => {
      eventSource.close()
    }
  }, [setJobs, updateJob, removeJob, setSamplingRate, setWarmingUp])
}
