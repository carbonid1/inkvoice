import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useDeleteVoice } from './useDeleteVoice'

describe('useDeleteVoice', () => {
  it('deleteVoice callback is stable across rerenders', () => {
    const { result, rerender } = renderHook(() => useDeleteVoice())
    const first = result.current.deleteVoice
    rerender()
    expect(result.current.deleteVoice).toBe(first)
  })

  it('restoreVoice callback is stable across rerenders', () => {
    const { result, rerender } = renderHook(() => useDeleteVoice())
    expect(result.current.restoreVoice).toBeTypeOf('function')
    const first = result.current.restoreVoice
    rerender()
    expect(result.current.restoreVoice).toBe(first)
  })
})
