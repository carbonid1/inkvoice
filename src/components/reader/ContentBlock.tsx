'use client'

import type { RefObject } from 'react'
import type { ContentBlock as ContentBlockType, TextSegment } from '@/lib/types/book'

interface ContentBlockProps {
  block: ContentBlockType
  currentSentence: number
  onSentenceClick?: (chapter: number, sentence: number) => void
  currentChapter: number
  sentenceRef: RefObject<HTMLSpanElement>
  isInTitleGroup?: boolean
  isSubtitle?: boolean
}

const renderSegments = (
  segments: TextSegment[] | undefined,
  currentSentence: number,
  onSentenceClick: ((chapter: number, sentence: number) => void) | undefined,
  currentChapter: number,
  sentenceRef: RefObject<HTMLSpanElement>
) => {
  if (!segments) return null
  return segments.map((segment, idx) => {
    const isActive = segment.sentenceIndex === currentSentence
    return (
      <span key={idx}>
        <span
          ref={isActive ? sentenceRef : undefined}
          onClick={() => onSentenceClick?.(currentChapter, segment.sentenceIndex)}
          className={`cursor-pointer transition-colors ${
            isActive
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded px-0.5 -mx-0.5'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          dangerouslySetInnerHTML={{ __html: segment.html }}
        />{' '}
      </span>
    )
  })
}

export const ContentBlock = ({
  block,
  currentSentence,
  onSentenceClick,
  currentChapter,
  sentenceRef,
  isInTitleGroup,
  isSubtitle,
}: ContentBlockProps) => {
  const segments = (segs: TextSegment[] | undefined) =>
    renderSegments(segs, currentSentence, onSentenceClick, currentChapter, sentenceRef)

  switch (block.type) {
    case 'heading': {
      const HeadingTag = `h${block.level || 2}` as keyof JSX.IntrinsicElements

      if (isInTitleGroup) {
        const titleClasses = isSubtitle
          ? 'text-lg font-medium text-gray-600 dark:text-gray-400 text-center mb-6'
          : 'text-2xl font-bold text-center mt-12 mb-2'
        return <HeadingTag className={titleClasses}>{segments(block.segments)}</HeadingTag>
      }

      const headingClasses: Record<number, string> = {
        1: 'text-3xl font-bold mt-8 mb-4',
        2: 'text-2xl font-semibold mt-6 mb-3',
        3: 'text-xl font-semibold mt-5 mb-2',
        4: 'text-lg font-medium mt-4 mb-2',
        5: 'text-base font-medium mt-3 mb-1',
        6: 'text-sm font-medium mt-2 mb-1',
      }
      return (
        <HeadingTag className={headingClasses[block.level || 2] || headingClasses[2]}>
          {segments(block.segments)}
        </HeadingTag>
      )
    }

    case 'paragraph':
      if (isInTitleGroup) {
        const titleClasses = isSubtitle
          ? 'text-lg font-medium text-gray-600 dark:text-gray-400 text-center mb-6'
          : 'text-2xl font-bold text-center mt-12 mb-2'
        return <p className={titleClasses}>{segments(block.segments)}</p>
      }
      return <p className="mb-4 leading-relaxed">{segments(block.segments)}</p>

    case 'blockquote':
      return (
        <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4 italic text-gray-700 dark:text-gray-300">
          {segments(block.segments)}
        </blockquote>
      )

    case 'list':
      return (
        <ul className="list-none mb-4 space-y-1">
          {block.items?.map((itemSegments, idx) => (
            <li key={idx}>{segments(itemSegments)}</li>
          ))}
        </ul>
      )

    case 'image':
      if (block.src) {
        return (
          <figure className="my-6">
            <img
              src={block.src}
              alt={block.alt || ''}
              className="max-w-full h-auto mx-auto rounded"
            />
            {block.alt && (
              <figcaption className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                {block.alt}
              </figcaption>
            )}
          </figure>
        )
      }
      return null

    default:
      return null
  }
}
