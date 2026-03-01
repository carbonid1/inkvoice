import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useUploadVoice } from './useUploadVoice'

describe('useUploadVoice', () => {
  it('upload callback is stable across rerenders', () => {
    const { result, rerender } = renderHook(() => useUploadVoice())
    const first = result.current.upload
    rerender()
    expect(result.current.upload).toBe(first)
  })

  it('reset callback is stable across rerenders', () => {
    const { result, rerender } = renderHook(() => useUploadVoice())
    const first = result.current.reset
    rerender()
    expect(result.current.reset).toBe(first)
  })

  it('initializes with correct defaults', () => {
    const { result } = renderHook(() => useUploadVoice())
    expect(result.current.uploading).toBe(false)
    expect(result.current.error).toBeNull()
  })
})
