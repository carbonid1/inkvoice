'use client'

import type { ContentBlock as ContentBlockType, TextSegment } from '@/lib/types/book'
import type { MouseEvent, RefObject } from 'react'
import { isFilenameAlt } from '../helpers/isFilenameAlt/isFilenameAlt'
import { renderSegments } from '../helpers/renderSegments/renderSegments'

interface ContentBlockProps {
  block: ContentBlockType
  currentParagraph: number
  onParagraphClick?: (chapter: number, paragraph: number) => void
  onParagraphContextMenu?: (e: MouseEvent, chapter: number, paragraph: number) => void
  currentChapter: number
  paragraphRef: RefObject<HTMLSpanElement | null>
  isInTitleGroup?: boolean
  isSubtitle?: boolean
  bookmarkedParagraphs?: Set<number>
}

export const ContentBlock = ({
  block,
  currentParagraph,
  onParagraphClick,
  onParagraphContextMenu,
  currentChapter,
  paragraphRef,
  isInTitleGroup,
  isSubtitle,
  bookmarkedParagraphs,
}: ContentBlockProps) => {
  const segments = (segs: TextSegment[] | undefined) =>
    renderSegments({
      segments: segs,
      currentParagraph,
      onParagraphClick,
      onParagraphContextMenu,
      currentChapter,
      paragraphRef,
      bookmarkedParagraphs,
    })

  switch (block.type) {
    case 'heading': {
      const HeadingTag = `h${block.level || 2}` as keyof JSX.IntrinsicElements

      if (isInTitleGroup) {
        const titleClasses = isSubtitle
          ? 'text-lg font-medium text-muted-foreground text-center mb-6'
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
          ? 'text-lg font-medium text-muted-foreground text-center mb-6'
          : 'text-2xl font-bold text-center mt-12 mb-2'
        return <p className={titleClasses}>{segments(block.segments)}</p>
      }
      return <p className="mb-4 leading-relaxed">{segments(block.segments)}</p>

    case 'blockquote':
      return (
        <blockquote className="border-border text-muted-foreground my-1 border-l-2 pl-5 text-[0.95rem] leading-relaxed italic">
          {segments(block.segments)}
        </blockquote>
      )

    case 'attribution':
      return (
        <p className="text-muted-foreground my-1 pl-5 text-right text-sm">
          {'\u2014 '}
          {segments(block.segments)}
        </p>
      )

    case 'list': {
      const depthPadding = ['', 'pl-6', 'pl-12', 'pl-16'][block.level ?? 0] ?? 'pl-16'
      return (
        <ul className={`mb-1 list-none space-y-1 ${depthPadding}`}>
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
            className="mx-auto h-auto max-w-full rounded-sm"
          />
          {caption && (
            <figcaption className="text-muted-foreground mt-2 text-center text-sm">
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
