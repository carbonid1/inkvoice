import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useDeleteBook } from './useDeleteBook'

describe('useDeleteBook', () => {
  it('deleteBook callback is stable across rerenders', () => {
    const { result, rerender } = renderHook(() => useDeleteBook())
    const first = result.current.deleteBook

    rerender()
    expect(result.current.deleteBook).toBe(first)
  })

  it('restoreBook callback is stable across rerenders', () => {
    const { result, rerender } = renderHook(() => useDeleteBook())

    expect(result.current.restoreBook).toBeTypeOf('function')
    const first = result.current.restoreBook

    rerender()
    expect(result.current.restoreBook).toBe(first)
  })
})
