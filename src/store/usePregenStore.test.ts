import { beforeEach, describe, expect, it } from 'vitest'
import { buildPregenJob } from '@/lib/services/pregenQueue/pregenQueue.fixtures'
import { PREGEN_JOB_STATUS, type PregenJob } from '@/lib/services/pregenQueue/pregenQueue.types'
import { usePregenStore } from './usePregenStore'

const buildRunningJob = (overrides: Partial<PregenJob> = {}): PregenJob =>
  buildPregenJob({ status: PREGEN_JOB_STATUS.IN_PROGRESS, ...overrides })

beforeEach(() => {
  usePregenStore.setState({
    warmingUpBookId: null,
    panelOpen: false,
    jobs: {},
    progressSamples: {},
  })
})

describe('usePregenStore.setWarmingUp', () => {
  it('sets and clears warmingUpBookId', () => {
    usePregenStore.getState().setWarmingUp('book-1')
    expect(usePregenStore.getState().warmingUpBookId).toBe('book-1')

    usePregenStore.getState().setWarmingUp(null)
    expect(usePregenStore.getState().warmingUpBookId).toBeNull()
  })
})

describe('usePregenStore progress samples', () => {
  it('records a sample per in-progress update so consumers can measure generation rate', () => {
    usePregenStore.getState().updateJob(buildRunningJob({ completedParagraphs: 10 }))
    usePregenStore.getState().updateJob(buildRunningJob({ completedParagraphs: 12 }))

    const samples = usePregenStore.getState().progressSamples['book-1']

    expect(samples?.map(s => s.completedParagraphs)).toEqual([10, 12])
    expect(samples?.every(s => typeof s.at === 'number')).toBe(true)
  })

  it('resets the measurement when generation stops running, so idle gaps cannot dilute the rate', () => {
    usePregenStore.getState().updateJob(buildRunningJob({ completedParagraphs: 10 }))
    usePregenStore
      .getState()
      .updateJob(buildPregenJob({ status: PREGEN_JOB_STATUS.PAUSED, completedParagraphs: 10 }))

    expect(usePregenStore.getState().progressSamples['book-1']).toEqual([])
  })

  it('drops samples along with the job on removal', () => {
    usePregenStore.getState().updateJob(buildRunningJob({ completedParagraphs: 10 }))
    usePregenStore.getState().removeJob('book-1')

    expect(usePregenStore.getState().progressSamples['book-1']).toBeUndefined()
  })

  it('drops the pending generation request when its job is removed, so the reader is not stuck waiting', () => {
    usePregenStore
      .getState()
      .setPendingGenerationRequest({ bookId: 'book-1', chapter: 2, paragraph: 5 })
    usePregenStore.getState().removeJob('book-1')

    expect(usePregenStore.getState().pendingGenerationRequest).toBeNull()
  })

  it('keeps another book’s pending generation request on removal', () => {
    usePregenStore
      .getState()
      .setPendingGenerationRequest({ bookId: 'book-2', chapter: 2, paragraph: 5 })
    usePregenStore.getState().removeJob('book-1')

    expect(usePregenStore.getState().pendingGenerationRequest).toEqual({
      bookId: 'book-2',
      chapter: 2,
      paragraph: 5,
    })
  })

  it('resets all samples on a jobs snapshot, so a reconnect cannot blend stale rates', () => {
    usePregenStore.getState().updateJob(buildRunningJob({ completedParagraphs: 10 }))
    usePregenStore.getState().setJobs([buildRunningJob({ completedParagraphs: 11 })])

    expect(usePregenStore.getState().progressSamples).toEqual({})
  })

  it('keeps the sample buffer bounded', () => {
    for (let i = 0; i < 50; i++) {
      usePregenStore.getState().updateJob(buildRunningJob({ completedParagraphs: i }))
    }

    const samples = usePregenStore.getState().progressSamples['book-1']

    expect(samples?.length).toBeLessThanOrEqual(30)
    expect(samples?.at(-1)?.completedParagraphs).toBe(49)
  })
})

describe('usePregenStore panel visibility', () => {
  it('opens and closes the panel via setPanelOpen', () => {
    usePregenStore.getState().setPanelOpen(true)
    expect(usePregenStore.getState().panelOpen).toBe(true)

    usePregenStore.getState().setPanelOpen(false)
    expect(usePregenStore.getState().panelOpen).toBe(false)
  })

  it('flips the panel state via togglePanel', () => {
    expect(usePregenStore.getState().panelOpen).toBe(false)

    usePregenStore.getState().togglePanel()
    expect(usePregenStore.getState().panelOpen).toBe(true)

    usePregenStore.getState().togglePanel()
    expect(usePregenStore.getState().panelOpen).toBe(false)
  })
})
