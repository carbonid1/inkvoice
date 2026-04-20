import { beforeEach, describe, expect, it } from 'vitest'
import { usePregenStore } from './usePregenStore'

beforeEach(() => {
  usePregenStore.setState({ warmingUpBookId: null })
})

describe('usePregenStore.setWarmingUp', () => {
  it('sets and clears warmingUpBookId', () => {
    usePregenStore.getState().setWarmingUp('book-1')
    expect(usePregenStore.getState().warmingUpBookId).toBe('book-1')

    usePregenStore.getState().setWarmingUp(null)
    expect(usePregenStore.getState().warmingUpBookId).toBeNull()
  })
})
