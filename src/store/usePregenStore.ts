import type { PregenJob } from '@/lib/services/pregenQueue/pregenQueue.types'
import { create } from 'zustand'

export type Estimate = {
  totalParagraphs: number
  cachedParagraphs: number
  estimatedSizeBytes: number
  estimatedGenerationMinutes: number
}

type PregenState = {
  jobs: Record<string, PregenJob>
  estimates: Record<string, Estimate>
  loaded: boolean
  setJobs: (jobs: PregenJob[]) => void
  updateJob: (job: PregenJob) => void
  removeJob: (bookId: string) => void
  setEstimates: (estimates: Record<string, Estimate>) => void
  updateEstimate: (bookId: string, estimate: Estimate) => void
}

export const usePregenStore = create<PregenState>(set => ({
  jobs: {},
  estimates: {},
  loaded: false,

  setJobs: jobs => {
    const map: Record<string, PregenJob> = {}
    for (const job of jobs) {
      map[job.bookId] = job
    }
    set({ jobs: map, loaded: true })
  },

  updateJob: job =>
    set(state => ({
      jobs: { ...state.jobs, [job.bookId]: job },
    })),

  removeJob: bookId =>
    set(state => {
      const { [bookId]: _, ...rest } = state.jobs
      return { jobs: rest }
    }),

  setEstimates: estimates => set({ estimates }),

  updateEstimate: (bookId, estimate) =>
    set(state => ({
      estimates: { ...state.estimates, [bookId]: estimate },
    })),
}))
