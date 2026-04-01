'use client'

import type { TextSegment } from '@/lib/types/book'
import type { MouseEvent, RefObject } from 'react'
import { ACTIVE_PARAGRAPH_HIGHLIGHT } from '../../Reader.consts'

export type RenderSegmentsParams = {
  segments: TextSegment[] | undefined
  currentParagraph: number
  onParagraphClick: ((chapter: number, paragraph: number) => void) | undefined
  onParagraphContextMenu?: (e: MouseEvent, chapter: number, paragraph: number) => void
  currentChapter: number
  paragraphRef: RefObject<HTMLSpanElement | null>
  bookmarkedParagraphs?: Set<number>
}

export const SegmentList = (props: RenderSegmentsParams) => <>{renderSegments(props)}</>

export const renderSegments = ({
  segments,
  currentParagraph,
  onParagraphClick,
  onParagraphContextMenu,
  currentChapter,
  paragraphRef,
  bookmarkedParagraphs,
}: RenderSegmentsParams) => {
  if (!segments) return null
  return segments.map((segment, idx) => {
    const isActive = segment.paragraphIndex === currentParagraph
    const isBookmarked = bookmarkedParagraphs?.has(segment.paragraphIndex) ?? false

    return (
      <span key={idx}>
        <span
          ref={isActive ? (paragraphRef as React.RefObject<HTMLSpanElement>) : undefined}
          data-active-paragraph={isActive || undefined}
          onClick={() => onParagraphClick?.(currentChapter, segment.paragraphIndex)}
          onContextMenu={
            onParagraphContextMenu
              ? e => onParagraphContextMenu(e, currentChapter, segment.paragraphIndex)
              : undefined
          }
          className={`cursor-pointer transition-colors ${
            isActive ? `${ACTIVE_PARAGRAPH_HIGHLIGHT} -mx-0.5 px-0.5` : 'hover:bg-accent'
          } ${isBookmarked ? 'border-attention -ml-1 border-l-2 pl-1' : ''}`}
          dangerouslySetInnerHTML={{ __html: segment.html }}
        />{' '}
      </span>
    )
  })
}
