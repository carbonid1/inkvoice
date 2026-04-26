import { act, renderHook } from '@testing-library/react'
import { type MockInstance, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAudioPlayer } from './useAudioPlayer'

interface MockAudio {
  play: MockInstance
  pause: MockInstance
  load: MockInstance
  removeAttribute: MockInstance
  src: string
  currentTime: number
  onended: ((ev: Event) => void) | null
  onerror: ((ev: Event) => void) | null
}

const createMockAudio = (): MockAudio => ({
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  load: vi.fn(),
  removeAttribute: vi.fn(),
  src: '',
  currentTime: 0,
  onended: null,
  onerror: null,
})

let mockAudio: MockAudio

beforeEach(() => {
  mockAudio = createMockAudio()
  // Must use function() — arrow functions can't be called with `new`
  vi.stubGlobal(
    'Audio',
    // eslint-disable-next-line prefer-arrow-callback
    vi.fn(function () {
      return mockAudio
    }),
  )
})

describe('useAudioPlayer', () => {
  describe('callback referential stability', () => {
    const callbacks = [
      'play',
      'resume',
      'pause',
      'stop',
      'setPlaying',
      'setLoading',
      'setError',
      'shouldPlay',
    ] as const

    callbacks.forEach(name => {
      it(`${name} is stable across re-renders`, () => {
        const { result, rerender } = renderHook(() => useAudioPlayer())
        const first = result.current[name]

        rerender()
        expect(result.current[name]).toBe(first)
      })
    })
  })

  describe('state bail-out', () => {
    it('setLoading(true) when already true does not change state reference', () => {
      const { result, rerender } = renderHook(() => useAudioPlayer())

      act(() => result.current.setLoading(true))
      rerender()
      const stateAfterFirst = {
        isPlaying: result.current.isPlaying,
        isLoading: result.current.isLoading,
        error: result.current.error,
      }

      act(() => result.current.setLoading(true))
      rerender()
      const stateAfterSecond = {
        isPlaying: result.current.isPlaying,
        isLoading: result.current.isLoading,
        error: result.current.error,
      }

      expect(stateAfterSecond).toEqual(stateAfterFirst)
    })
  })

  describe('play', () => {
    it('sets src on the audio element', async () => {
      const { result } = renderHook(() => useAudioPlayer())

      await act(() => result.current.play('blob:http://localhost/abc'))
      expect(mockAudio.src).toBe('blob:http://localhost/abc')
    })

    it('sets isPlaying to true after playing', async () => {
      const { result } = renderHook(() => useAudioPlayer())

      await act(() => result.current.play('blob:http://localhost/abc'))
      expect(result.current.isPlaying).toBe(true)
    })
  })

  describe('resume', () => {
    it('does not change src on the audio element', async () => {
      const { result } = renderHook(() => useAudioPlayer())

      await act(() => result.current.play('blob:http://localhost/abc'))
      act(() => result.current.pause())

      const srcBeforeResume = mockAudio.src

      await act(() => result.current.resume())

      expect(mockAudio.src).toBe(srcBeforeResume)
    })

    it('calls play() on the underlying element without pause() first', async () => {
      const { result } = renderHook(() => useAudioPlayer())

      await act(() => result.current.play('blob:http://localhost/abc'))
      act(() => result.current.pause())

      mockAudio.play.mockClear()
      mockAudio.pause.mockClear()

      await act(() => result.current.resume())

      expect(mockAudio.play).toHaveBeenCalledOnce()
      expect(mockAudio.pause).not.toHaveBeenCalled()
    })

    it('sets isPlaying to true', async () => {
      const { result } = renderHook(() => useAudioPlayer())

      await act(() => result.current.play('blob:http://localhost/abc'))
      act(() => result.current.pause())
      expect(result.current.isPlaying).toBe(false)

      await act(() => result.current.resume())
      expect(result.current.isPlaying).toBe(true)
    })

    it('sets error message when underlying play() rejects with Error', async () => {
      const { result } = renderHook(() => useAudioPlayer())

      await act(() => result.current.play('blob:http://localhost/abc'))
      act(() => result.current.pause())

      mockAudio.play.mockRejectedValueOnce(new Error('NotAllowedError'))

      await act(() => result.current.resume())
      expect(result.current.error).toBe('NotAllowedError')
      expect(result.current.isPlaying).toBe(false)
    })

    it('sets fallback error when underlying play() rejects with non-Error', async () => {
      const { result } = renderHook(() => useAudioPlayer())

      await act(() => result.current.play('blob:http://localhost/abc'))
      act(() => result.current.pause())

      mockAudio.play.mockRejectedValueOnce('some string rejection')

      await act(() => result.current.resume())
      expect(result.current.error).toBe('Failed to resume audio')
      expect(result.current.isPlaying).toBe(false)
    })
  })

  describe('stop', () => {
    it('pauses and suppresses stale onended events', async () => {
      const onEnded = vi.fn()
      const { result } = renderHook(() => useAudioPlayer({ onEnded }))

      await act(() => result.current.play('blob:http://localhost/abc'))
      mockAudio.pause.mockClear()

      act(() => result.current.stop())

      expect(mockAudio.pause).toHaveBeenCalledOnce()

      // Stale onended should be suppressed
      act(() => mockAudio.onended?.(new Event('ended')))
      expect(onEnded).not.toHaveBeenCalled()

      // After play(), onended should fire normally again
      await act(() => result.current.play('blob:http://localhost/def'))
      act(() => mockAudio.onended?.(new Event('ended')))
      expect(onEnded).toHaveBeenCalledOnce()
    })
  })

  describe('play interrupted by pause', () => {
    it('does not set error when play() is aborted by pause()', async () => {
      const { result } = renderHook(() => useAudioPlayer())

      // Simulate play() being interrupted by pause() — browser throws AbortError
      const abortError = new DOMException(
        'The play() request was interrupted by a call to pause().',
        'AbortError',
      )

      mockAudio.play.mockRejectedValueOnce(abortError)

      await act(() => result.current.play('blob:http://localhost/abc'))

      expect(result.current.error).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })

    it('does not set error when resume() is aborted by pause()', async () => {
      const { result } = renderHook(() => useAudioPlayer())

      await act(() => result.current.play('blob:http://localhost/abc'))
      act(() => result.current.pause())

      const abortError = new DOMException(
        'The play() request was interrupted by a call to pause().',
        'AbortError',
      )

      mockAudio.play.mockRejectedValueOnce(abortError)

      await act(() => result.current.resume())

      expect(result.current.error).toBeNull()
    })
  })

  describe('play → pause → resume flow', () => {
    it('preserves currentTime through the full cycle', async () => {
      const { result } = renderHook(() => useAudioPlayer())

      await act(() => result.current.play('blob:http://localhost/abc'))
      mockAudio.currentTime = 12.5

      act(() => result.current.pause())
      expect(mockAudio.currentTime).toBe(12.5)

      await act(() => result.current.resume())
      expect(mockAudio.currentTime).toBe(12.5)
      expect(mockAudio.src).toBe('blob:http://localhost/abc')
    })
  })
})
