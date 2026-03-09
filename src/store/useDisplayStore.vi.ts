'use client'

import { beforeEach, describe, expect, it } from 'vitest'
import { useDisplayStore } from './useDisplayStore'

beforeEach(() => {
  useDisplayStore.setState({ fontSize: 'medium' })
})

describe('useDisplayStore', () => {
  it('defaults to medium font size', () => {
    expect(useDisplayStore.getState().fontSize).toBe('medium')
  })

  it('updates font size via setFontSize', () => {
    useDisplayStore.getState().setFontSize('large')
    expect(useDisplayStore.getState().fontSize).toBe('large')
  })

  it('partializes only fontSize for persistence', () => {
    const state = useDisplayStore.getState()
    const partialize = (
      useDisplayStore as unknown as {
        persist: { getOptions: () => { partialize: (s: typeof state) => unknown } }
      }
    ).persist.getOptions().partialize

    const result = partialize(state)
    expect(result).toEqual({ fontSize: 'medium' })
    expect(result).not.toHaveProperty('setFontSize')
  })
})
