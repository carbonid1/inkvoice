'use client'

import type { TextSegment } from '@/lib/types/book'
import type { RefObject } from 'react'

export type RenderSegmentsParams = {
  segments: TextSegment[] | undefined
  currentSentence: number
  onSentenceClick: ((chapter: number, sentence: number) => void) | undefined
  currentChapter: number
  sentenceRef: RefObject<HTMLSpanElement>
  bookmarkedSentences?: Set<number>
}

export const SegmentList = (props: RenderSegmentsParams) => <>{renderSegments(props)}</>

export const renderSegments = ({
  segments,
  currentSentence,
  onSentenceClick,
  currentChapter,
  sentenceRef,
  bookmarkedSentences,
}: RenderSegmentsParams) => {
  if (!segments) return null
  return segments.map((segment, idx) => {
    const isActive = segment.sentenceIndex === currentSentence
    const isBookmarked = bookmarkedSentences?.has(segment.sentenceIndex) ?? false
    return (
      <span key={idx}>
        <span
          ref={isActive ? sentenceRef : undefined}
          onClick={() => onSentenceClick?.(currentChapter, segment.sentenceIndex)}
          className={`cursor-pointer transition-colors ${
            isActive
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded px-0.5 -mx-0.5'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          } ${isBookmarked ? 'border-l-2 border-amber-400 dark:border-amber-500 pl-1 -ml-1' : ''}`}
          dangerouslySetInnerHTML={{ __html: segment.html }}
        />{' '}
      </span>
    )
  })
}
