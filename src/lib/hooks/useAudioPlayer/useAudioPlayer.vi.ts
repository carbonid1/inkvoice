import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAudioPlayer } from './useAudioPlayer'

describe('useAudioPlayer', () => {
  describe('callback referential stability', () => {
    const callbacks = [
      'play',
      'pause',
      'setPlaying',
      'setLoading',
      'setError',
      'shouldPlay',
    ] as const

    callbacks.forEach((name) => {
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
      const stateAfterFirst = { isPlaying: result.current.isPlaying, isLoading: result.current.isLoading, error: result.current.error }
      act(() => result.current.setLoading(true))
      rerender()
      const stateAfterSecond = { isPlaying: result.current.isPlaying, isLoading: result.current.isLoading, error: result.current.error }
      expect(stateAfterSecond).toEqual(stateAfterFirst)
    })
  })
})
