import { fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { TagBadge } from './TagBadge'

const renderWith = (ui: React.ReactElement) => render(<StrictMode>{ui}</StrictMode>)

describe('TagBadge', () => {
  it('renders tag text', () => {
    renderWith(<TagBadge tag="british" />)
    expect(screen.getByText('british')).toBeInTheDocument()
  })

  it('shows remove button when onRemove provided', () => {
    const onRemove = vi.fn()
    renderWith(<TagBadge tag="male" onRemove={onRemove} />)

    const removeButton = screen.getByRole('button', { name: /remove male/i })
    expect(removeButton).toBeInTheDocument()

    fireEvent.click(removeButton)
    expect(onRemove).toHaveBeenCalledOnce()
  })

  it('hides remove button when onRemove not provided', () => {
    renderWith(<TagBadge tag="warm" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
