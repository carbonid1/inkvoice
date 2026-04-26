'use client'

import type { RefObject } from 'react'
import type { TextSegment } from '@/lib/types/book'
import { ParagraphContextMenu } from '../../../ParagraphContextMenu/ParagraphContextMenu'
import { ACTIVE_PARAGRAPH_HIGHLIGHT } from '../../Reader.consts'

export interface RenderSegmentsParams {
  segments: TextSegment[] | undefined
  currentParagraph: number
  onParagraphClick: ((chapter: number, paragraph: number) => void) | undefined
  onCopyText?: (chapter: number, paragraph: number) => void
  onRegenerate?: (chapter: number, paragraph: number) => void | Promise<void>
  currentChapter: number
  paragraphRef: RefObject<HTMLSpanElement | null>
  bookmarkedParagraphs?: Set<number>
}

export const SegmentList = (props: RenderSegmentsParams) => <>{renderSegments(props)}</>

export const renderSegments = ({
  segments,
  currentParagraph,
  onParagraphClick,
  onCopyText,
  onRegenerate,
  currentChapter,
  paragraphRef,
  bookmarkedParagraphs,
}: RenderSegmentsParams) => {
  if (!segments) return null
  return segments.map((segment, idx) => {
    const isActive = segment.paragraphIndex === currentParagraph
    const isBookmarked = bookmarkedParagraphs?.has(segment.paragraphIndex) ?? false

    const paragraphSpan = (
      <span
        ref={isActive ? paragraphRef : undefined}
        data-paragraph
        data-active-paragraph={isActive || undefined}
        onClick={() => {
          if (window.getSelection()?.isCollapsed === false) return
          onParagraphClick?.(currentChapter, segment.paragraphIndex)
        }}
        className={`cursor-pointer transition-colors ${
          isActive ? `${ACTIVE_PARAGRAPH_HIGHLIGHT} -mx-0.5 px-0.5` : 'hover:bg-accent'
        } ${isBookmarked ? 'border-attention -ml-1 border-l-2 pl-1' : ''}`}
        dangerouslySetInnerHTML={{ __html: segment.html }}
      />
    )

    const wrapped =
      onCopyText && onRegenerate ? (
        <ParagraphContextMenu
          chapter={currentChapter}
          paragraph={segment.paragraphIndex}
          onCopyText={onCopyText}
          onRegenerate={onRegenerate}
        >
          {paragraphSpan}
        </ParagraphContextMenu>
      ) : (
        paragraphSpan
      )

    return <span key={idx}>{wrapped} </span>
  })
}
