import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PREGEN_JOB_STATUS, type PregenJob } from '@/lib/services/pregenQueue/pregenQueue.types'
import { usePregenStore } from '@/store/usePregenStore'
import { startPregeneration } from './startPregeneration'

const buildJob = (overrides: Partial<PregenJob> = {}): PregenJob => ({
  id: 'job-1',
  bookId: 'book-1',
  voice: 'narrator',
  status: PREGEN_JOB_STATUS.QUEUED,
  totalParagraphs: 100,
  completedParagraphs: 0,
  generatedDurationMs: 0,
  currentChapter: 0,
  currentParagraph: 0,
  errorMessage: null,
  createdAt: 0,
  updatedAt: 0,
  ...overrides,
})

beforeEach(() => {
  usePregenStore.setState({
    jobs: {},
    estimates: {},
    warmingUpBookId: null,
    loaded: true,
    panelOpen: false,
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('startPregeneration', () => {
  it('writes the returned job into the pregen store on success', async () => {
    const job = buildJob()

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(job) }),
    )

    const result = await startPregeneration('book-1')

    expect(result).toEqual(job)
    expect(usePregenStore.getState().jobs['book-1']).toEqual(job)
  })

  it('opens the progress panel on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(buildJob()) }),
    )

    await startPregeneration('book-1')

    expect(usePregenStore.getState().panelOpen).toBe(true)
  })

  it('leaves the progress panel closed when the API returns 409 over budget', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ budget: { ok: false, shortfallBytes: 2_000_000_000 } }),
      }),
    )

    await startPregeneration('book-1')

    expect(usePregenStore.getState().panelOpen).toBe(false)
  })

  it('returns null and skips store update when the API returns 409 over budget', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ budget: { ok: false, shortfallBytes: 2_000_000_000 } }),
      }),
    )

    const result = await startPregeneration('book-1')

    expect(result).toBeNull()
    expect(usePregenStore.getState().jobs['book-1']).toBeUndefined()
  })

  it('returns null when the API errors with a non-409 status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) }),
    )

    const result = await startPregeneration('book-1')

    expect(result).toBeNull()
    expect(usePregenStore.getState().jobs['book-1']).toBeUndefined()
  })
})
