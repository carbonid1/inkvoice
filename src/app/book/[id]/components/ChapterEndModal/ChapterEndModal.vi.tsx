import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChapterEndModal } from './ChapterEndModal'

const defaultProps = {
  isOpen: true,
  completedChapterTitle: 'The Beginning',
  nextChapterTitle: 'The Journey',
  chaptersCompleted: 3,
  totalChapters: 10,
  onContinue: vi.fn(),
  onDismiss: vi.fn(),
}

afterEach(cleanup)

describe('ChapterEndModal', () => {
  it('renders chapter titles and progress when open', () => {
    render(<ChapterEndModal {...defaultProps} />)

    expect(screen.getByText('The Beginning')).toBeInTheDocument()
    expect(screen.getByText('The Journey')).toBeInTheDocument()
    expect(screen.getByText('Chapter 3 of 10')).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    render(<ChapterEndModal {...defaultProps} isOpen={false} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('calls onContinue when Continue button is clicked', () => {
    const onContinue = vi.fn()
    render(<ChapterEndModal {...defaultProps} onContinue={onContinue} />)

    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(onContinue).toHaveBeenCalledOnce()
  })

  it('calls onDismiss when backdrop is clicked', () => {
    const onDismiss = vi.fn()
    render(<ChapterEndModal {...defaultProps} onDismiss={onDismiss} />)

    fireEvent.click(screen.getByTestId('chapter-end-backdrop'))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
