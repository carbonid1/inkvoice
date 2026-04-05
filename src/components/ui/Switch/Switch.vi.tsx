import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Switch } from './Switch'

afterEach(cleanup)

describe('Switch', () => {
  it('renders as a switch with the correct checked state', () => {
    render(<Switch checked={true} onChange={() => {}} aria-label="Toggle" />)
    expect(screen.getByRole('switch')).toBeChecked()
  })

  it('calls onChange when clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Switch checked={false} onChange={onChange} aria-label="Toggle" />)

    await user.click(screen.getByRole('switch'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('does not call onChange when disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Switch checked={false} onChange={onChange} disabled aria-label="Toggle" />)

    await user.click(screen.getByRole('switch'))
    expect(onChange).not.toHaveBeenCalled()
  })
})
