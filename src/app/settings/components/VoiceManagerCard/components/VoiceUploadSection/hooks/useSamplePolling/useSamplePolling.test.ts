import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSamplePolling } from './useSamplePolling'

describe('useSamplePolling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('calls onSampleReady when HEAD returns 200', async () => {
    const onSampleReady = vi.fn()
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null))

    const { result } = renderHook(() => useSamplePolling({ onSampleReady }))
    result.current.startPolling('my-voice')

    // First poll fires after 3s
    await vi.advanceTimersByTimeAsync(3000)

    expect(fetch).toHaveBeenCalledWith('/api/voices/my-voice/sample', { method: 'HEAD' })
    expect(onSampleReady).toHaveBeenCalledWith('my-voice')
  })

  it('retries when HEAD returns non-200', async () => {
    const onSampleReady = vi.fn()
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null))

    const { result } = renderHook(() => useSamplePolling({ onSampleReady }))
    result.current.startPolling('my-voice')

    // First poll — 404
    await vi.advanceTimersByTimeAsync(3000)
    expect(onSampleReady).not.toHaveBeenCalled()

    // Second poll — 200
    await vi.advanceTimersByTimeAsync(3000)
    expect(onSampleReady).toHaveBeenCalledWith('my-voice')
  })

  it('stops polling after timeout', async () => {
    const onSampleReady = vi.fn()
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 404 }))

    const { result } = renderHook(() => useSamplePolling({ onSampleReady }))
    result.current.startPolling('my-voice')

    // Advance past the 120s timeout
    await vi.advanceTimersByTimeAsync(123000)

    const callCount = vi.mocked(fetch).mock.calls.length
    // Advance more — should not make more calls
    await vi.advanceTimersByTimeAsync(10000)
    expect(vi.mocked(fetch).mock.calls.length).toBe(callCount)
    expect(onSampleReady).not.toHaveBeenCalled()
  })

  it('clears polling on unmount', async () => {
    const onSampleReady = vi.fn()
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 404 }))

    const { result, unmount } = renderHook(() => useSamplePolling({ onSampleReady }))
    result.current.startPolling('my-voice')

    unmount()

    await vi.advanceTimersByTimeAsync(10000)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('supports concurrent polls for different voices', async () => {
    const onSampleReady = vi.fn()
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(null)) // voice-a
      .mockResolvedValueOnce(new Response(null, { status: 404 })) // voice-b
      .mockResolvedValueOnce(new Response(null)) // voice-b retry

    const { result } = renderHook(() => useSamplePolling({ onSampleReady }))
    result.current.startPolling('voice-a')
    result.current.startPolling('voice-b')

    await vi.advanceTimersByTimeAsync(3000)
    expect(onSampleReady).toHaveBeenCalledWith('voice-a')
    expect(onSampleReady).not.toHaveBeenCalledWith('voice-b')

    await vi.advanceTimersByTimeAsync(3000)
    expect(onSampleReady).toHaveBeenCalledWith('voice-b')
  })

  it('startPolling is referentially stable', () => {
    const { result, rerender } = renderHook(() => useSamplePolling({ onSampleReady: vi.fn() }))
    const first = result.current.startPolling
    rerender()
    expect(result.current.startPolling).toBe(first)
  })
})
