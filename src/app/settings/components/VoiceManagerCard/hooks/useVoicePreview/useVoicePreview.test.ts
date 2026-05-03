import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useVoicePreview } from './useVoicePreview'

interface MockAudio {
  play: ReturnType<typeof vi.fn>
  pause: ReturnType<typeof vi.fn>
  onended: (() => void) | null
  onerror: (() => void) | null
  src: string
}

let mockAudios: MockAudio[]

const getMockAudio = (index: number): MockAudio => {
  const audio = mockAudios[index]

  if (!audio) throw new Error(`Mock Audio at index ${index} was never created`)
  return audio
}

beforeEach(() => {
  mockAudios = []
  vi.restoreAllMocks()

  vi.stubGlobal(
    'Audio',
    class implements MockAudio {
      play = vi.fn().mockResolvedValue(undefined)
      pause = vi.fn()
      onended: (() => void) | null = null
      onerror: (() => void) | null = null
      src = ''
      constructor() {
        mockAudios.push(this)
      }
    },
  )

  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['audio'], { type: 'audio/wav' })),
    }),
  )

  let urlCounter = 0

  vi.stubGlobal('URL', {
    ...globalThis.URL,
    createObjectURL: vi.fn(() => `blob:mock-${++urlCounter}`),
    revokeObjectURL: vi.fn(),
  })
})

describe('useVoicePreview', () => {
  it('fetches and creates blob URL on first play', async () => {
    const { result } = renderHook(() => useVoicePreview())

    await act(() => result.current.play('narrator', 'sample'))

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
    expect(result.current.playing).toEqual({ name: 'narrator', type: 'sample' })
  })

  it('reuses cached blob URL on replay', async () => {
    const { result } = renderHook(() => useVoicePreview())

    // First play
    await act(() => result.current.play('narrator', 'sample'))

    // End playback
    act(() => getMockAudio(0).onended?.())
    expect(result.current.playing).toBeNull()

    // Second play — should reuse cache
    await act(() => result.current.play('narrator', 'sample'))

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
    expect(result.current.playing).toEqual({ name: 'narrator', type: 'sample' })
  })

  it('fetches separately for different voice or type', async () => {
    const { result } = renderHook(() => useVoicePreview())

    await act(() => result.current.play('narrator', 'sample'))
    act(() => getMockAudio(0).onended?.())

    await act(() => result.current.play('narrator', 'source'))

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2)
  })

  it('revokes all cached URLs on unmount', async () => {
    const { result, unmount } = renderHook(() => useVoicePreview())

    await act(() => result.current.play('narrator', 'sample'))
    act(() => getMockAudio(0).onended?.())

    await act(() => result.current.play('narrator', 'source'))
    act(() => getMockAudio(1).onended?.())

    unmount()

    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2)
  })

  it('does not revoke URL when toggling off', async () => {
    const { result } = renderHook(() => useVoicePreview())

    await act(() => result.current.play('narrator', 'sample'))

    // Toggle off same voice
    await act(() => result.current.play('narrator', 'sample'))

    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    expect(result.current.playing).toBeNull()
  })

  it('keeps play callback stable across rerenders', () => {
    const { result, rerender } = renderHook(() => useVoicePreview())
    const first = result.current.play

    rerender()
    expect(result.current.play).toBe(first)
  })

  it('stop pauses playback and clears playing state', async () => {
    const { result } = renderHook(() => useVoicePreview())

    await act(() => result.current.play('narrator', 'sample'))
    expect(result.current.playing).toEqual({ name: 'narrator', type: 'sample' })

    act(() => result.current.stop())

    expect(getMockAudio(0).pause).toHaveBeenCalled()
    expect(result.current.playing).toBeNull()
  })

  it('stop is a no-op when nothing is playing', () => {
    const { result } = renderHook(() => useVoicePreview())

    expect(() => act(() => result.current.stop())).not.toThrow()
    expect(result.current.playing).toBeNull()
  })

  it('keeps stop callback stable across rerenders', () => {
    const { result, rerender } = renderHook(() => useVoicePreview())
    const first = result.current.stop

    rerender()
    expect(result.current.stop).toBe(first)
  })
})
