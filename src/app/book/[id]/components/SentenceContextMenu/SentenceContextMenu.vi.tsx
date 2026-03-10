'use client'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SentenceContextMenu } from './SentenceContextMenu'

const defaultProps = {
  onRegenerate: vi.fn().mockResolvedValue(undefined),
  onCopyText: vi.fn(),
  onClose: vi.fn(),
}

describe('SentenceContextMenu', () => {
  it('renders nothing when target is null', () => {
    const { container } = render(<SentenceContextMenu {...defaultProps} target={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('shows Regenerate Audio button when target is provided', () => {
    render(
      <SentenceContextMenu
        {...defaultProps}
        target={{ x: 100, y: 200, chapter: 3, sentence: 5 }}
      />,
    )
    expect(screen.getByRole('menuitem', { name: 'Regenerate Audio' })).toBeInTheDocument()
  })

  it('calls onRegenerate with chapter and sentence and closes', async () => {
    const onRegenerate = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(
      <SentenceContextMenu
        onRegenerate={onRegenerate}
        onCopyText={vi.fn()}
        onClose={onClose}
        target={{ x: 100, y: 200, chapter: 3, sentence: 5 }}
      />,
    )

    await user.click(screen.getByRole('menuitem', { name: 'Regenerate Audio' }))

    expect(onRegenerate).toHaveBeenCalledWith(3, 5)
    expect(onClose).toHaveBeenCalled()
  })

  it('closes on Escape key', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(
      <SentenceContextMenu
        {...defaultProps}
        onClose={onClose}
        target={{ x: 100, y: 200, chapter: 0, sentence: 0 }}
      />,
    )

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('closes on click outside', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(
      <div>
        <span data-testid="outside">outside</span>
        <SentenceContextMenu
          {...defaultProps}
          onClose={onClose}
          target={{ x: 100, y: 200, chapter: 0, sentence: 0 }}
        />
      </div>,
    )

    await user.click(screen.getByTestId('outside'))
    expect(onClose).toHaveBeenCalled()
  })
})
