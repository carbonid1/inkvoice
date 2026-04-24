'use client'

import { useProgressStore } from '@/store/useProgressStore'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BookCardContextMenu } from './BookCardContextMenu'

const defaultProps = {
  onRemove: vi.fn(),
  onClose: vi.fn(),
}

const target = { x: 100, y: 100, bookId: 'book-1' }

beforeEach(() => {
  useProgressStore.setState({ progress: {}, loaded: false })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('BookCardContextMenu finished toggle', () => {
  it('shows "Mark as Done" when book is not finished and marks it on click', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(<BookCardContextMenu {...defaultProps} target={target} onClose={onClose} />)

    await user.click(screen.getByRole('menuitem', { name: 'Mark as Done' }))

    expect(useProgressStore.getState().progress['book-1']?.finishedAt).toBeTypeOf('number')
    expect(onClose).toHaveBeenCalled()
  })

  it('shows "Mark as Unread" when book is finished and clears it on click', async () => {
    useProgressStore.setState({
      progress: { 'book-1': { chapter: 0, paragraph: 0, finishedAt: 1000 } },
    })
    const user = userEvent.setup()

    render(<BookCardContextMenu {...defaultProps} target={target} />)

    await user.click(screen.getByRole('menuitem', { name: 'Mark as Unread' }))

    expect(useProgressStore.getState().progress['book-1']?.finishedAt).toBeNull()
  })
})
