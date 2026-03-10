'use client'

import type { TextSegment } from '@/lib/types/book'
import type { MouseEvent, RefObject } from 'react'
import { ACTIVE_SENTENCE_HIGHLIGHT } from '../../Reader.consts'
import { highlightSearchMatches } from '../highlightSearchMatches/highlightSearchMatches'

export type RenderSegmentsParams = {
  segments: TextSegment[] | undefined
  currentSentence: number
  onSentenceClick: ((chapter: number, sentence: number) => void) | undefined
  onSentenceContextMenu?: (e: MouseEvent, chapter: number, sentence: number) => void
  currentChapter: number
  sentenceRef: RefObject<HTMLSpanElement>
  bookmarkedSentences?: Set<number>
  searchQuery?: string
  activeSearchSentence?: number
}

export const SegmentList = (props: RenderSegmentsParams) => <>{renderSegments(props)}</>

export const renderSegments = ({
  segments,
  currentSentence,
  onSentenceClick,
  onSentenceContextMenu,
  currentChapter,
  sentenceRef,
  bookmarkedSentences,
  searchQuery,
  activeSearchSentence,
}: RenderSegmentsParams) => {
  if (!segments) return null
  return segments.map((segment, idx) => {
    const isActive = segment.sentenceIndex === currentSentence
    const isBookmarked = bookmarkedSentences?.has(segment.sentenceIndex) ?? false

    const html = searchQuery
      ? highlightSearchMatches(
          segment.html,
          searchQuery,
          activeSearchSentence === segment.sentenceIndex,
        )
      : segment.html

    return (
      <span key={idx}>
        <span
          ref={isActive ? sentenceRef : undefined}
          onClick={() => onSentenceClick?.(currentChapter, segment.sentenceIndex)}
          onContextMenu={
            onSentenceContextMenu
              ? e => onSentenceContextMenu(e, currentChapter, segment.sentenceIndex)
              : undefined
          }
          className={`cursor-pointer transition-colors ${
            isActive
              ? `${ACTIVE_SENTENCE_HIGHLIGHT} px-0.5 -mx-0.5`
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          } ${isBookmarked ? 'border-l-2 border-amber-400 dark:border-amber-500 pl-1 -ml-1' : ''}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />{' '}
      </span>
    )
  })
}
