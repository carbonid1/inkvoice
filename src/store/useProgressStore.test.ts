import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProgressStore } from './useProgressStore'

beforeEach(() => {
  vi.useFakeTimers()
  useProgressStore.setState({ progress: {}, loaded: false })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('markFinished', () => {
  it('sets finishedAt to current time and debounce-saves', async () => {
    vi.setSystemTime(new Date('2026-04-24T10:00:00Z'))

    useProgressStore.getState().markFinished('book-1')

    expect(useProgressStore.getState().progress['book-1']?.finishedAt).toBe(
      new Date('2026-04-24T10:00:00Z').getTime(),
    )
    expect(fetch).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(2000)
    expect(fetch).toHaveBeenCalledWith(
      '/api/progress/book-1',
      expect.objectContaining({ method: 'PUT' }),
    )
  })

  it('preserves existing progress fields', () => {
    useProgressStore.setState({
      progress: { 'book-1': { chapter: 3, paragraph: 10, lastReadAt: 5000 } },
    })

    useProgressStore.getState().markFinished('book-1')

    const progress = useProgressStore.getState().progress['book-1']

    expect(progress?.chapter).toBe(3)
    expect(progress?.paragraph).toBe(10)
    expect(progress?.lastReadAt).toBe(5000)
    expect(progress?.finishedAt).toBeDefined()
  })
})

describe('unmarkFinished', () => {
  it('clears finishedAt and debounce-saves', async () => {
    useProgressStore.setState({
      progress: { 'book-1': { chapter: 0, paragraph: 0, finishedAt: 1000 } },
    })

    useProgressStore.getState().unmarkFinished('book-1')

    expect(useProgressStore.getState().progress['book-1']?.finishedAt).toBeNull()

    await vi.advanceTimersByTimeAsync(2000)
    expect(fetch).toHaveBeenCalledWith(
      '/api/progress/book-1',
      expect.objectContaining({ method: 'PUT' }),
    )
  })

  it('does nothing when no progress exists for book', () => {
    useProgressStore.getState().unmarkFinished('unknown-book')
    expect(useProgressStore.getState().progress['unknown-book']).toBeUndefined()
  })
})
