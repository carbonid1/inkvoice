import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { VoiceSampleEvent } from '@/lib/services/voiceSampleEvents/voiceSampleEvents.types'
import { useSampleSSE } from './useSampleSSE'

interface MockEventSource {
  url: string
  close: ReturnType<typeof vi.fn>
  fire: (event: VoiceSampleEvent) => void
}

let mockEventSource: MockEventSource | null = null

beforeEach(() => {
  mockEventSource = null

  class FakeEventSource {
    url: string
    close = vi.fn()
    private listeners = new Map<string, ((e: MessageEvent) => void)[]>()

    constructor(url: string) {
      this.url = url
      mockEventSource = {
        url,
        close: this.close,
        fire: event => {
          const handlers = this.listeners.get('sample') ?? []

          const messageEvent = new MessageEvent('sample', { data: JSON.stringify(event) })

          for (const handler of handlers) handler(messageEvent)
        },
      }
    }

    addEventListener(type: string, handler: (e: MessageEvent) => void) {
      const list = this.listeners.get(type) ?? []

      list.push(handler)
      this.listeners.set(type, list)
    }
  }

  vi.stubGlobal('EventSource', FakeEventSource)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const expectEventSource = (): MockEventSource => {
  if (!mockEventSource) throw new Error('EventSource was not constructed')
  return mockEventSource
}

describe('useSampleSSE', () => {
  it('opens the SSE connection on mount', () => {
    renderHook(() => useSampleSSE({ onSampleReady: vi.fn() }))

    expect(expectEventSource().url).toBe('/api/voices/sample-events')
  })

  it('closes the connection on unmount', () => {
    const { unmount } = renderHook(() => useSampleSSE({ onSampleReady: vi.fn() }))
    const source = expectEventSource()

    unmount()
    expect(source.close).toHaveBeenCalled()
  })

  it('calls onSampleReady when a ready event arrives for a pending voice', () => {
    const onSampleReady = vi.fn()
    const { result } = renderHook(() => useSampleSSE({ onSampleReady }))

    act(() => {
      result.current.startListening('voice-a')
    })

    act(() => {
      expectEventSource().fire({ type: 'sample', voiceName: 'voice-a', status: 'ready' })
    })

    expect(onSampleReady).toHaveBeenCalledWith('voice-a')
  })

  it('calls onSampleFailed when a failed event arrives for a pending voice', () => {
    const onSampleReady = vi.fn()
    const onSampleFailed = vi.fn()
    const { result } = renderHook(() => useSampleSSE({ onSampleReady, onSampleFailed }))

    act(() => {
      result.current.startListening('voice-a')
    })

    act(() => {
      expectEventSource().fire({ type: 'sample', voiceName: 'voice-a', status: 'failed' })
    })

    expect(onSampleFailed).toHaveBeenCalledWith('voice-a')
    expect(onSampleReady).not.toHaveBeenCalled()
  })

  it('ignores events for voices not registered via startListening', () => {
    const onSampleReady = vi.fn()

    renderHook(() => useSampleSSE({ onSampleReady }))

    act(() => {
      expectEventSource().fire({ type: 'sample', voiceName: 'voice-a', status: 'ready' })
    })

    expect(onSampleReady).not.toHaveBeenCalled()
  })

  it('only fires once per voice', () => {
    const onSampleReady = vi.fn()
    const { result } = renderHook(() => useSampleSSE({ onSampleReady }))

    act(() => {
      result.current.startListening('voice-a')
    })

    act(() => {
      expectEventSource().fire({ type: 'sample', voiceName: 'voice-a', status: 'ready' })
      expectEventSource().fire({ type: 'sample', voiceName: 'voice-a', status: 'ready' })
    })

    expect(onSampleReady).toHaveBeenCalledTimes(1)
  })

  it('supports concurrent listeners for different voices', () => {
    const onSampleReady = vi.fn()
    const { result } = renderHook(() => useSampleSSE({ onSampleReady }))

    act(() => {
      result.current.startListening('voice-a')
      result.current.startListening('voice-b')
    })

    act(() => {
      expectEventSource().fire({ type: 'sample', voiceName: 'voice-a', status: 'ready' })
    })
    expect(onSampleReady).toHaveBeenCalledWith('voice-a')
    expect(onSampleReady).not.toHaveBeenCalledWith('voice-b')

    act(() => {
      expectEventSource().fire({ type: 'sample', voiceName: 'voice-b', status: 'ready' })
    })
    expect(onSampleReady).toHaveBeenCalledWith('voice-b')
  })

  it('startListening is referentially stable', () => {
    const { result, rerender } = renderHook(() => useSampleSSE({ onSampleReady: vi.fn() }))
    const first = result.current.startListening

    rerender()
    expect(result.current.startListening).toBe(first)
  })
})
