'use client'

import type { PregenJob } from '@/lib/services/pregenQueue/pregenQueue.types'
import { usePregenStore } from '@/store/usePregenStore'
import { useEffect } from 'react'

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
    })
  } catch {
    // Estimate refresh is best-effort
  }
}

export const usePregenSSE = () => {
  const setJobs = usePregenStore(s => s.setJobs)
  const updateJob = usePregenStore(s => s.updateJob)
  const removeJob = usePregenStore(s => s.removeJob)

  useEffect(() => {
    const eventSource = new EventSource('/api/pregenerate/events')

    eventSource.addEventListener('snapshot', (e: MessageEvent) => {
      const jobs: PregenJob[] = JSON.parse(e.data)
      setJobs(jobs)
    })

    eventSource.addEventListener('update', (e: MessageEvent) => {
      const data: { type: 'update'; job: PregenJob } = JSON.parse(e.data)
      updateJob(data.job)
    })

    eventSource.addEventListener('deleted', (e: MessageEvent) => {
      const data: { type: 'deleted'; bookId: string } = JSON.parse(e.data)
      removeJob(data.bookId)
      refetchEstimate(data.bookId)
    })

    eventSource.onerror = () => {
      if (usePregenStore.getState().loaded) {
        usePregenStore.setState({ loaded: false })
      }
    }

    return () => {
      eventSource.close()
    }
  }, [setJobs, updateJob, removeJob])
}
