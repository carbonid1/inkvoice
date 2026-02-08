import { act, renderHook } from '@testing-library/react'
import { StrictMode, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useDebouncedLoading } from './useDebouncedLoading'

const wrapper = ({ children }: { children: ReactNode }) => (
  <StrictMode>{children}</StrictMode>
)

describe('useDebouncedLoading', () => {
  it('returns false initially even when loading is true', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useDebouncedLoading(true), { wrapper })

    expect(result.current).toBe(false)

    vi.useRealTimers()
  })

  it('returns true after delay when loading persists', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useDebouncedLoading(true), { wrapper })

    act(() => vi.advanceTimersByTime(200))

    expect(result.current).toBe(true)

    vi.useRealTimers()
  })

  it('stays false if loading clears before delay', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ loading }) => useDebouncedLoading(loading),
      { wrapper, initialProps: { loading: true } },
    )

    act(() => vi.advanceTimersByTime(100))
    rerender({ loading: false })

    act(() => vi.advanceTimersByTime(200))

    expect(result.current).toBe(false)

    vi.useRealTimers()
  })

  it('clears immediately when loading becomes false', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ loading }) => useDebouncedLoading(loading),
      { wrapper, initialProps: { loading: true } },
    )

    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toBe(true)

    rerender({ loading: false })
    expect(result.current).toBe(false)

    vi.useRealTimers()
  })
})
