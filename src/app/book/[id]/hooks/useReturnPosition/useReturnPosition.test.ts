'use client'

import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useReturnPosition } from './useReturnPosition'

describe('useReturnPosition', () => {
  it('starts with null savedPosition', () => {
    const { result } = renderHook(() => useReturnPosition())

    expect(result.current.savedPosition).toBeNull()
  })

  it('savePosition stores chapter and paragraph', () => {
    const { result } = renderHook(() => useReturnPosition())

    act(() => result.current.savePosition(2, 5))
    expect(result.current.savedPosition).toEqual({ chapter: 2, paragraph: 5 })
  })

  it('savePosition does not overwrite existing position (first-write-wins)', () => {
    const { result } = renderHook(() => useReturnPosition())

    act(() => result.current.savePosition(2, 5))
    act(() => result.current.savePosition(4, 10))
    expect(result.current.savedPosition).toEqual({ chapter: 2, paragraph: 5 })
  })

  it('clearPosition resets to null', () => {
    const { result } = renderHook(() => useReturnPosition())

    act(() => result.current.savePosition(2, 5))
    act(() => result.current.clearPosition())
    expect(result.current.savedPosition).toBeNull()
  })

  it('navigateBack calls callback with saved position and clears', () => {
    const onNavigate = vi.fn()
    const { result } = renderHook(() => useReturnPosition())

    act(() => result.current.savePosition(2, 5))
    act(() => result.current.navigateBack(onNavigate))
    expect(onNavigate).toHaveBeenCalledWith(2, 5)
    expect(result.current.savedPosition).toBeNull()
  })

  it('navigateBack is a no-op when no saved position', () => {
    const onNavigate = vi.fn()
    const { result } = renderHook(() => useReturnPosition())

    act(() => result.current.navigateBack(onNavigate))
    expect(onNavigate).not.toHaveBeenCalled()
    expect(result.current.savedPosition).toBeNull()
  })

  it('savePosition is stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useReturnPosition())
    const first = result.current.savePosition

    rerender()
    expect(result.current.savePosition).toBe(first)
  })

  it('clearPosition is stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useReturnPosition())
    const first = result.current.clearPosition

    rerender()
    expect(result.current.clearPosition).toBe(first)
  })

  it('navigateBack is stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useReturnPosition())
    const first = result.current.navigateBack

    rerender()
    expect(result.current.navigateBack).toBe(first)
  })
})
