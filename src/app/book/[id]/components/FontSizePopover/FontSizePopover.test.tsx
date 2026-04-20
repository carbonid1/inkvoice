'use client'

import { useDisplayStore } from '@/store/useDisplayStore'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { FontSizePopover } from './FontSizePopover'

beforeEach(() => {
  useDisplayStore.setState({ fontSize: 'medium' })
})

describe('FontSizePopover', () => {
  it('renders the trigger button', () => {
    render(<FontSizePopover />)
    expect(screen.getByRole('button', { name: /font size/i })).toBeInTheDocument()
  })

  it('opens popover with size options on click', async () => {
    const user = userEvent.setup()
    render(<FontSizePopover />)

    await user.click(screen.getByRole('button', { name: /font size/i }))

    expect(screen.getByRole('button', { name: 'Small' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Medium' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Large' })).toBeInTheDocument()
  })

  it('highlights the active font size', async () => {
    const user = userEvent.setup()
    useDisplayStore.setState({ fontSize: 'large' })
    render(<FontSizePopover />)

    await user.click(screen.getByRole('button', { name: /font size/i }))

    expect(screen.getByRole('button', { name: 'Large' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Medium' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('updates store when selecting a size', async () => {
    const user = userEvent.setup()
    render(<FontSizePopover />)

    await user.click(screen.getByRole('button', { name: /font size/i }))
    await user.click(screen.getByRole('button', { name: 'Large' }))

    expect(useDisplayStore.getState().fontSize).toBe('large')
  })

  it('closes on Escape key', async () => {
    const user = userEvent.setup()
    render(<FontSizePopover />)

    await user.click(screen.getByRole('button', { name: /font size/i }))
    expect(screen.getByRole('button', { name: 'Small' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('button', { name: 'Small' })).not.toBeInTheDocument()
  })

  it('closes on click outside', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <span data-testid="outside">outside</span>
        <FontSizePopover />
      </div>,
    )

    await user.click(screen.getByRole('button', { name: /font size/i }))
    expect(screen.getByRole('button', { name: 'Small' })).toBeInTheDocument()

    await user.click(screen.getByTestId('outside'))
    expect(screen.queryByRole('button', { name: 'Small' })).not.toBeInTheDocument()
  })
})
