import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useUpdateVoiceTags } from './useUpdateVoiceTags'

describe('useUpdateVoiceTags', () => {
  it('updateTags callback is stable across rerenders', () => {
    const { result, rerender } = renderHook(() => useUpdateVoiceTags())
    const first = result.current.updateTags
    rerender()
    expect(result.current.updateTags).toBe(first)
  })

  it('initializes with saving false and no error', () => {
    const { result } = renderHook(() => useUpdateVoiceTags())
    expect(result.current.saving).toBe(false)
    expect(result.current.error).toBeNull()
  })
})
