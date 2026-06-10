import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildPregenJob } from '@/lib/services/pregenQueue/pregenQueue.fixtures'
import { usePregenStore } from '@/store/usePregenStore'
import { generateAudioFromHere } from './generateAudioFromHere'

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

describe('generateAudioFromHere', () => {
  it('repositions the active job via PATCH and writes the result into the store', async () => {
    const repositioned = buildPregenJob({ id: 'job-2', currentChapter: 7, currentParagraph: 3 })
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(repositioned) })

    vi.stubGlobal('fetch', fetchMock)

    const result = await generateAudioFromHere('book-1', 7, 3)

    expect(fetchMock).toHaveBeenCalledWith('/api/pregenerate/book-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reposition', chapter: 7, paragraph: 3 }),
    })
    expect(result).toEqual(repositioned)
    expect(usePregenStore.getState().jobs['book-1']).toEqual(repositioned)
  })

  it('starts a fresh job from the position when no job is active to reposition', async () => {
    const created = buildPregenJob({ currentChapter: 7, currentParagraph: 3 })
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve(created) })

    vi.stubGlobal('fetch', fetchMock)

    const result = await generateAudioFromHere('book-1', 7, 3)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/pregenerate/book-1?startChapter=7&startParagraph=3',
      { method: 'POST' },
    )
    expect(result).toEqual(created)
    expect(usePregenStore.getState().jobs['book-1']).toEqual(created)
  })

  it('returns null without touching the store on other API errors', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) })

    vi.stubGlobal('fetch', fetchMock)

    const result = await generateAudioFromHere('book-1', 7, 3)

    expect(result).toBeNull()
    expect(usePregenStore.getState().jobs['book-1']).toBeUndefined()
  })
})
