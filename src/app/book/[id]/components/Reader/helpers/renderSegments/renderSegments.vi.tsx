'use client'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { RenderSegmentsParams } from './renderSegments'
import { SegmentList } from './renderSegments'

const makeSegment = (paragraphIndex: number, html: string) => ({ paragraphIndex, html })

const defaultProps = (overrides?: Partial<RenderSegmentsParams>): RenderSegmentsParams => ({
  segments: [makeSegment(0, 'Hello world')],
  currentParagraph: -1,
  onParagraphClick: undefined,
  currentChapter: 0,
  paragraphRef: createRef<HTMLSpanElement>(),
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

  it('applies active highlight to the current paragraph', () => {
    render(
      <SegmentList
        {...defaultProps({
          segments: [makeSegment(0, 'Active'), makeSegment(1, 'Inactive')],
          currentParagraph: 0,
        })}
      />,
    )

    const active = screen.getByText('Active')
    const inactive = screen.getByText('Inactive')

    expect(active.className).toContain('bg-amber-200/70')
    expect(active.className).not.toContain('hover:bg-gray-100')
    expect(inactive.className).not.toContain('bg-amber-200/70')
  })

  it('applies hover classes to inactive paragraphs', () => {
    render(
      <SegmentList
        {...defaultProps({
          segments: [makeSegment(0, 'Active'), makeSegment(1, 'Inactive')],
          currentParagraph: 0,
        })}
      />,
    )

    const inactive = screen.getByText('Inactive')
    expect(inactive.className).toContain('hover:bg-accent')
  })

  it('calls onParagraphClick with chapter and paragraph index on click', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()

    render(
      <SegmentList
        {...defaultProps({
          segments: [makeSegment(5, 'Click me')],
          currentChapter: 3,
          onParagraphClick: onClick,
        })}
      />,
    )

    await user.click(screen.getByText('Click me'))
    expect(onClick).toHaveBeenCalledWith(3, 5)
  })

  it('applies bookmark border to bookmarked paragraphs', () => {
    render(
      <SegmentList
        {...defaultProps({
          segments: [makeSegment(0, 'Marked'), makeSegment(1, 'Unmarked')],
          bookmarkedParagraphs: new Set([0]),
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
