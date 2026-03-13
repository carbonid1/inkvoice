'use client'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ParagraphContextMenu } from './ParagraphContextMenu'

const defaultProps = {
  onRegenerate: vi.fn().mockResolvedValue(undefined),
  onCopyText: vi.fn(),
  onClose: vi.fn(),
}

describe('ParagraphContextMenu', () => {
  it('renders nothing when target is null', () => {
    const { container } = render(<ParagraphContextMenu {...defaultProps} target={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('shows Regenerate Audio button when target is provided', () => {
    render(
      <ParagraphContextMenu
        {...defaultProps}
        target={{ x: 100, y: 200, chapter: 3, paragraph: 5 }}
      />,
    )
    expect(screen.getByRole('menuitem', { name: 'Regenerate Audio' })).toBeInTheDocument()
  })

  it('calls onRegenerate with chapter and paragraph and closes', async () => {
    const onRegenerate = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(
      <ParagraphContextMenu
        onRegenerate={onRegenerate}
        onCopyText={vi.fn()}
        onClose={onClose}
        target={{ x: 100, y: 200, chapter: 3, paragraph: 5 }}
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
      <ParagraphContextMenu
        {...defaultProps}
        onClose={onClose}
        target={{ x: 100, y: 200, chapter: 0, paragraph: 0 }}
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
        <ParagraphContextMenu
          {...defaultProps}
          onClose={onClose}
          target={{ x: 100, y: 200, chapter: 0, paragraph: 0 }}
        />
      </div>,
    )

    await user.click(screen.getByTestId('outside'))
    expect(onClose).toHaveBeenCalled()
  })
})
