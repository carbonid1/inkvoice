import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildPregenJob } from '@/lib/services/pregenQueue/pregenQueue.fixtures'
import { usePregenStore } from '@/store/usePregenStore'
import { startPregeneration } from './startPregeneration'

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
    const job = buildPregenJob()

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
      vi
        .fn()
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve(buildPregenJob()),
        }),
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

  it('passes the start position to the API as query params', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(buildPregenJob()) })

    vi.stubGlobal('fetch', fetchMock)

    await startPregeneration('book-1', { chapter: 5, paragraph: 12 })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/pregenerate/book-1?startChapter=5&startParagraph=12',
      {
        method: 'POST',
      },
    )
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
