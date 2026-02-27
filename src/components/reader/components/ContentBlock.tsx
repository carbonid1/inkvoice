'use client'

import type { ContentBlock as ContentBlockType, TextSegment } from '@/lib/types/book'
import type { RefObject } from 'react'
import { isFilenameAlt } from '../helpers/isFilenameAlt/isFilenameAlt'
import { renderSegments } from '../helpers/renderSegments/renderSegments'

interface ContentBlockProps {
  block: ContentBlockType
  currentSentence: number
  onSentenceClick?: (chapter: number, sentence: number) => void
  currentChapter: number
  sentenceRef: RefObject<HTMLSpanElement>
  isInTitleGroup?: boolean
  isSubtitle?: boolean
  bookmarkedSentences?: Set<number>
}

export const ContentBlock = ({
  block,
  currentSentence,
  onSentenceClick,
  currentChapter,
  sentenceRef,
  isInTitleGroup,
  isSubtitle,
  bookmarkedSentences,
}: ContentBlockProps) => {
  const segments = (segs: TextSegment[] | undefined) =>
    renderSegments({
      segments: segs,
      currentSentence,
      onSentenceClick,
      currentChapter,
      sentenceRef,
      bookmarkedSentences,
    })

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
        <blockquote className="border-l-2 border-gray-300 dark:border-gray-600 pl-5 my-1 italic text-gray-600 dark:text-gray-400 text-[0.95rem] leading-relaxed">
          {segments(block.segments)}
        </blockquote>
      )

    case 'attribution':
      return (
        <p className="pl-5 my-1 text-sm text-gray-500 dark:text-gray-500 text-right">
          {'\u2014 '}
          {segments(block.segments)}
        </p>
      )

    case 'list': {
      const depthPadding = ['', 'pl-6', 'pl-12', 'pl-16'][block.level ?? 0] ?? 'pl-16'
      return (
        <ul className={`list-none mb-1 space-y-1 ${depthPadding}`}>
          {block.items?.map((itemSegments, idx) => (
            <li key={idx}>{segments(itemSegments)}</li>
          ))}
        </ul>
      )
    }

    case 'image': {
      if (!block.src) return null
      const caption = block.alt && !isFilenameAlt(block.alt) ? block.alt : undefined
      return (
        <figure className="my-6">
          <img
            src={block.src}
            alt={block.alt || ''}
            className="max-w-full h-auto mx-auto rounded"
          />
          {caption && (
            <figcaption className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
              {caption}
            </figcaption>
          )}
        </figure>
      )
    }

    default:
      return null
  }
}
