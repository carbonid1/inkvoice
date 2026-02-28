'use client'

import { useVoiceStore } from '@/store/useVoiceStore'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useBookVoice } from './useBookVoice'

beforeEach(() => {
  useVoiceStore.setState({ voice: 'narrator', bookVoices: {} })
})

describe('useBookVoice', () => {
  it('returns global default when no per-book override', () => {
    const { result } = renderHook(() => useBookVoice('book-1'))

    expect(result.current.effectiveVoice).toBe('narrator')
    expect(result.current.isOverridden).toBe(false)
  })

  it('returns per-book voice after setVoice', () => {
    const { result } = renderHook(() => useBookVoice('book-1'))

    act(() => result.current.setVoice('casual'))

    expect(result.current.effectiveVoice).toBe('casual')
    expect(result.current.isOverridden).toBe(true)
  })

  it('falls back to global after clearVoice', () => {
    const { result } = renderHook(() => useBookVoice('book-1'))

    act(() => result.current.setVoice('casual'))
    expect(result.current.effectiveVoice).toBe('casual')

    act(() => result.current.clearVoice())
    expect(result.current.effectiveVoice).toBe('narrator')
    expect(result.current.isOverridden).toBe(false)
  })

  it('does not affect other books when setting per-book voice', () => {
    const { result: book1 } = renderHook(() => useBookVoice('book-1'))
    const { result: book2 } = renderHook(() => useBookVoice('book-2'))

    act(() => book1.current.setVoice('casual'))

    expect(book1.current.effectiveVoice).toBe('casual')
    expect(book2.current.effectiveVoice).toBe('narrator')
  })

  it('reflects changed global default for books without override', () => {
    const { result } = renderHook(() => useBookVoice('book-1'))

    act(() => useVoiceStore.getState().setVoice('announcer'))

    expect(result.current.effectiveVoice).toBe('announcer')
    expect(result.current.isOverridden).toBe(false)
  })

  describe('callback referential stability', () => {
    it('setVoice is stable across rerenders', () => {
      const { result, rerender } = renderHook(() => useBookVoice('book-1'))
      const first = result.current.setVoice
      rerender()
      expect(result.current.setVoice).toBe(first)
    })

    it('clearVoice is stable across rerenders', () => {
      const { result, rerender } = renderHook(() => useBookVoice('book-1'))
      const first = result.current.clearVoice
      rerender()
      expect(result.current.clearVoice).toBe(first)
    })
  })
})
