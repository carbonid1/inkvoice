import { create } from 'zustand'
import type { BudgetCheck } from '@/lib/services/cache/helpers/checkBudget/checkBudget'
import { PREGEN_JOB_STATUS, type PregenJob } from '@/lib/services/pregenQueue/pregenQueue.types'

export interface Estimate {
  totalParagraphs: number
  cachedParagraphs: number
  estimatedSizeBytes: number
  estimatedGenerationMinutes: number
  budget: BudgetCheck
}

export interface ProgressSample {
  at: number
  completedParagraphs: number
}

export interface PendingGenerationRequest {
  bookId: string
  chapter: number
  paragraph: number
}

interface PregenState {
  jobs: Record<string, PregenJob>
  estimates: Record<string, Estimate>
  samplingRates: Record<string, number>
  progressSamples: Record<string, ProgressSample[]>
  /** Generate-from-here in flight: the reader position waiting for its audio to land. */
  pendingGenerationRequest: PendingGenerationRequest | null
  loaded: boolean
  warmingUpBookId: string | null
  panelOpen: boolean
  setJobs: (jobs: PregenJob[]) => void
  updateJob: (job: PregenJob) => void
  removeJob: (bookId: string) => void
  setEstimates: (estimates: Record<string, Estimate>) => void
  updateEstimate: (bookId: string, estimate: Estimate) => void
  setSamplingRate: (bookId: string, rate: number) => void
  setPendingGenerationRequest: (request: PendingGenerationRequest | null) => void
  setWarmingUp: (bookId: string | null) => void
  setPanelOpen: (open: boolean) => void
  togglePanel: () => void
}

const MAX_PROGRESS_SAMPLES = 30
const PROGRESS_SAMPLE_WINDOW_MS = 120_000

// The buffer resets whenever generation isn't actively running — a paused or
// queued gap would otherwise dilute the next measurement window's rate.
const appendProgressSample = (
  samples: ProgressSample[] | undefined,
  job: PregenJob,
): ProgressSample[] => {
  if (job.status !== PREGEN_JOB_STATUS.IN_PROGRESS) return []
  const now = Date.now()
  const recent = (samples ?? []).filter(sample => now - sample.at <= PROGRESS_SAMPLE_WINDOW_MS)

  return [...recent, { at: now, completedParagraphs: job.completedParagraphs }].slice(
    -MAX_PROGRESS_SAMPLES,
  )
}

export const usePregenStore = create<PregenState>(set => ({
  jobs: {},
  estimates: {},
  samplingRates: {},
  progressSamples: {},
  pendingGenerationRequest: null,
  loaded: false,
  warmingUpBookId: null,
  panelOpen: false,

  setJobs: jobs => {
    const map: Record<string, PregenJob> = {}

    for (const job of jobs) {
      map[job.bookId] = job
    }
    // Snapshots also arrive on SSE reconnect — samples gathered before the
    // gap would distort the measured rate, so the buffer starts over.
    set({ jobs: map, progressSamples: {}, loaded: true })
  },

  updateJob: job =>
    set(state => ({
      jobs: { ...state.jobs, [job.bookId]: job },
      progressSamples: {
        ...state.progressSamples,
        [job.bookId]: appendProgressSample(state.progressSamples[job.bookId], job),
      },
    })),

  removeJob: bookId =>
    set(state => {
      const { [bookId]: _, ...rest } = state.jobs
      const { [bookId]: _samples, ...restSamples } = state.progressSamples
      // A pending generate-from-here request can never be fulfilled once the
      // job is gone — dropping it frees the reader from the waiting state.
      const pendingGenerationRequest =
        state.pendingGenerationRequest?.bookId === bookId ? null : state.pendingGenerationRequest

      return { jobs: rest, progressSamples: restSamples, pendingGenerationRequest }
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

  setPendingGenerationRequest: request => set({ pendingGenerationRequest: request }),

  setWarmingUp: bookId => set({ warmingUpBookId: bookId }),

  setPanelOpen: open => set({ panelOpen: open }),

  togglePanel: () => set(state => ({ panelOpen: !state.panelOpen })),
}))
