import { create } from 'zustand'
import type { BudgetCheck } from '@/lib/services/cache/helpers/checkBudget/checkBudget'
import type { PregenJob } from '@/lib/services/pregenQueue/pregenQueue.types'

export interface Estimate {
  totalParagraphs: number
  cachedParagraphs: number
  estimatedSizeBytes: number
  estimatedGenerationMinutes: number
  budget: BudgetCheck
}

interface PregenState {
  jobs: Record<string, PregenJob>
  estimates: Record<string, Estimate>
  samplingRates: Record<string, number>
  loaded: boolean
  warmingUpBookId: string | null
  setJobs: (jobs: PregenJob[]) => void
  updateJob: (job: PregenJob) => void
  removeJob: (bookId: string) => void
  setEstimates: (estimates: Record<string, Estimate>) => void
  updateEstimate: (bookId: string, estimate: Estimate) => void
  setSamplingRate: (bookId: string, rate: number) => void
  setWarmingUp: (bookId: string | null) => void
}

export const usePregenStore = create<PregenState>(set => ({
  jobs: {},
  estimates: {},
  samplingRates: {},
  loaded: false,
  warmingUpBookId: null,

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

  setSamplingRate: (bookId, rate) =>
    set(state => ({
      samplingRates: { ...state.samplingRates, [bookId]: rate },
    })),

  setWarmingUp: bookId => set({ warmingUpBookId: bookId }),
}))
