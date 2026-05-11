import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useUploadBook } from './useUploadBook'

describe('useUploadBook', () => {
  it('upload callback is stable across rerenders', () => {
    const { result, rerender } = renderHook(() => useUploadBook())
    const first = result.current.upload

    rerender()
    expect(result.current.upload).toBe(first)
  })
})
