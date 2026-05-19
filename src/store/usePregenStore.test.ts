import { beforeEach, describe, expect, it } from 'vitest'
import { usePregenStore } from './usePregenStore'

beforeEach(() => {
  usePregenStore.setState({ warmingUpBookId: null, panelOpen: false })
})

describe('usePregenStore.setWarmingUp', () => {
  it('sets and clears warmingUpBookId', () => {
    usePregenStore.getState().setWarmingUp('book-1')
    expect(usePregenStore.getState().warmingUpBookId).toBe('book-1')

    usePregenStore.getState().setWarmingUp(null)
    expect(usePregenStore.getState().warmingUpBookId).toBeNull()
  })
})

describe('usePregenStore panel visibility', () => {
  it('opens and closes the panel via setPanelOpen', () => {
    usePregenStore.getState().setPanelOpen(true)
    expect(usePregenStore.getState().panelOpen).toBe(true)

    usePregenStore.getState().setPanelOpen(false)
    expect(usePregenStore.getState().panelOpen).toBe(false)
  })

  it('flips the panel state via togglePanel', () => {
    expect(usePregenStore.getState().panelOpen).toBe(false)

    usePregenStore.getState().togglePanel()
    expect(usePregenStore.getState().panelOpen).toBe(true)

    usePregenStore.getState().togglePanel()
    expect(usePregenStore.getState().panelOpen).toBe(false)
  })
})
