import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mockState = { autoAdvanceChapters: false, toggleAutoAdvance: vi.fn() }

vi.mock('@/store/usePlaybackStore', () => ({
  usePlaybackStore: (selector: (s: typeof mockState) => unknown) => selector(mockState),
}))

import { PlaybackCard } from './PlaybackCard'

afterEach(cleanup)

describe('PlaybackCard', () => {
  it('renders toggle in unchecked state when auto-advance is off', () => {
    mockState.autoAdvanceChapters = false
    render(<PlaybackCard />)

    const toggle = screen.getByRole('checkbox', { name: /auto-advance/i })
    expect(toggle).not.toBeChecked()
  })

  it('renders toggle in checked state when auto-advance is on', () => {
    mockState.autoAdvanceChapters = true
    render(<PlaybackCard />)

    const toggle = screen.getByRole('checkbox', { name: /auto-advance/i })
    expect(toggle).toBeChecked()
  })

  it('calls toggleAutoAdvance when clicked', () => {
    mockState.autoAdvanceChapters = false
    mockState.toggleAutoAdvance = vi.fn()
    render(<PlaybackCard />)

    fireEvent.click(screen.getByRole('checkbox', { name: /auto-advance/i }))
    expect(mockState.toggleAutoAdvance).toHaveBeenCalledOnce()
  })
})
