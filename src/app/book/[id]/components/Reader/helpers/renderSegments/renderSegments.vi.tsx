'use client'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { RenderSegmentsParams } from './renderSegments'
import { SegmentList } from './renderSegments'

const makeSegment = (sentenceIndex: number, html: string) => ({ sentenceIndex, html })

const defaultProps = (overrides?: Partial<RenderSegmentsParams>): RenderSegmentsParams => ({
  segments: [makeSegment(0, 'Hello world')],
  currentSentence: -1,
  onSentenceClick: undefined,
  currentChapter: 0,
  sentenceRef: createRef<HTMLSpanElement>(),
  ...overrides,
})

describe('SegmentList', () => {
  it('renders segment HTML content', () => {
    render(
      <SegmentList
        {...defaultProps({ segments: [makeSegment(0, 'The quick <em>brown</em> fox')] })}
      />,
    )

    expect(screen.getByText('brown').tagName).toBe('EM')
    expect(screen.getByText('brown').closest('span')).toBeInTheDocument()
  })

  it('applies active highlight to the current sentence', () => {
    render(
      <SegmentList
        {...defaultProps({
          segments: [makeSegment(0, 'Active'), makeSegment(1, 'Inactive')],
          currentSentence: 0,
        })}
      />,
    )

    const active = screen.getByText('Active')
    const inactive = screen.getByText('Inactive')

    expect(active.className).toContain('bg-amber-200/70')
    expect(active.className).not.toContain('hover:bg-gray-100')
    expect(inactive.className).not.toContain('bg-amber-200/70')
  })

  it('applies hover classes to inactive sentences', () => {
    render(
      <SegmentList
        {...defaultProps({
          segments: [makeSegment(0, 'Active'), makeSegment(1, 'Inactive')],
          currentSentence: 0,
        })}
      />,
    )

    const inactive = screen.getByText('Inactive')
    expect(inactive.className).toContain('hover:bg-gray-100')
  })

  it('calls onSentenceClick with chapter and sentence index on click', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()

    render(
      <SegmentList
        {...defaultProps({
          segments: [makeSegment(5, 'Click me')],
          currentChapter: 3,
          onSentenceClick: onClick,
        })}
      />,
    )

    await user.click(screen.getByText('Click me'))
    expect(onClick).toHaveBeenCalledWith(3, 5)
  })

  it('applies bookmark border to bookmarked sentences', () => {
    render(
      <SegmentList
        {...defaultProps({
          segments: [makeSegment(0, 'Marked'), makeSegment(1, 'Unmarked')],
          bookmarkedSentences: new Set([0]),
        })}
      />,
    )

    expect(screen.getByText('Marked').className).toContain('border-amber-400')
    expect(screen.getByText('Unmarked').className).not.toContain('border-amber-400')
  })

  it('renders nothing for undefined segments', () => {
    const { container } = render(<SegmentList {...defaultProps({ segments: undefined })} />)
    expect(container.innerHTML).toBe('')
  })
})
