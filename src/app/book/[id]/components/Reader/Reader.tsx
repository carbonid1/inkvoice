'use client'

import type { ContentBlock as ContentBlockType, ParsedChapter } from '@/lib/types/book'
import { useDisplayStore } from '@/store/useDisplayStore'
import type { RefObject } from 'react'
import { type MouseEvent, type ReactNode, useEffect, useRef } from 'react'
import { FONT_SIZE_CLASS } from '../FontSizePopover/FontSizePopover.consts'
import { ContentBlock } from './components/ContentBlock'
import { findDuplicateTitleIndex } from './helpers/findDuplicateTitleIndex/findDuplicateTitleIndex'
import { findTitleGroupMembers } from './helpers/findTitleGroupMembers/findTitleGroupMembers'
import { SegmentList } from './helpers/renderSegments/renderSegments'
import { ACTIVE_PARAGRAPH_HIGHLIGHT } from './Reader.consts'

interface ReaderProps {
  chapter: ParsedChapter
  currentChapter: number
  currentParagraph: number
  onParagraphClick?: (chapter: number, paragraph: number) => void
  onParagraphContextMenu?: (e: MouseEvent, chapter: number, paragraph: number) => void
  bookmarkedParagraphs?: Set<number>
  activeParagraphRef?: RefObject<HTMLSpanElement | null>
}

import { isAllCaps, toTitleCase } from '@/lib/epub/helpers/normalizeTitle/normalizeTitle'

const normalizeCaps = (block: ContentBlockType): ContentBlockType => {
  const text = block.segments?.map(s => s.html.replace(/<[^>]+>/g, '')).join('') || ''
  if (!isAllCaps(text)) return block
  return {
    ...block,
    segments: block.segments?.map(s => ({
      ...s,
      html: toTitleCase(s.html),
    })),
  }
}

export const Reader = ({
  chapter,
  currentChapter,
  currentParagraph,
  onParagraphClick,
  onParagraphContextMenu,
  bookmarkedParagraphs,
  activeParagraphRef: externalParagraphRef,
}: ReaderProps) => {
  const internalParagraphRef = useRef<HTMLSpanElement>(null)
  const currentParagraphRef = externalParagraphRef ?? internalParagraphRef

  useEffect(() => {
    if (currentParagraphRef.current) {
      currentParagraphRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [currentChapter, currentParagraph, chapter])

  const fontSize = useDisplayStore(s => s.fontSize)

  if (!chapter) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center">
        No content available
      </div>
    )
  }

  const hasContent = chapter.content && chapter.content.length > 0
  const proseClasses = `font-serif prose prose-lg dark:prose-invert max-w-none p-6 ${FONT_SIZE_CLASS[fontSize]} [&_a]:text-primary [&_a]:underline [&_a]:decoration-primary/40 [&_a]:underline-offset-2 [&_a]:hover:decoration-primary [&_a]:transition-colors`

  if (hasContent) {
    const content = chapter.content!
    const duplicateTitleIndex = findDuplicateTitleIndex(content, chapter.title)

    const { titleGroupStart, titleGroupMember } = findTitleGroupMembers(
      content,
      duplicateTitleIndex,
    )

    // Detect leading epigraph group: consecutive blockquote/attribution blocks
    // after skipping any title group blocks and leading headings
    const epigraphGroupMember = new Set<number>()
    const firstEpigraphCandidate = content.findIndex(
      (block, i) => !titleGroupMember.has(i) && block.type !== 'heading',
    )
    if (firstEpigraphCandidate !== -1) {
      for (let i = firstEpigraphCandidate; i < content.length; i++) {
        const epBlock = content[i]
        if (epBlock && (epBlock.type === 'blockquote' || epBlock.type === 'attribution')) {
          epigraphGroupMember.add(i)
        } else {
          break
        }
      }
    }

    const renderBlock = (block: ContentBlockType, idx: number) => {
      const isSubtitle = titleGroupMember.has(idx) && !titleGroupStart.has(idx)
      return (
        <ContentBlock
          key={idx}
          block={isSubtitle ? normalizeCaps(block) : block}
          currentParagraph={currentParagraph}
          onParagraphClick={onParagraphClick}
          onParagraphContextMenu={onParagraphContextMenu}
          currentChapter={currentChapter}
          paragraphRef={currentParagraphRef}
          isInTitleGroup={titleGroupMember.has(idx)}
          isSubtitle={isSubtitle}
          bookmarkedParagraphs={bookmarkedParagraphs}
        />
      )
    }

    // Build rendered elements, wrapping epigraph groups
    const elements: ReactNode[] = []
    let epigraphGroupStartIndex = -1

    content.forEach((block, idx) => {
      if (idx === duplicateTitleIndex) return
      if (epigraphGroupMember.has(idx)) {
        if (epigraphGroupStartIndex === -1) epigraphGroupStartIndex = idx
        // Check if next block is NOT in epigraph group (end of group)
        if (!epigraphGroupMember.has(idx + 1)) {
          elements.push(
            <div
              key={`epigraph-${epigraphGroupStartIndex}`}
              className="border-border mt-4 mb-6 pb-6"
            >
              {content
                .slice(epigraphGroupStartIndex, idx + 1)
                .map((b, i) => renderBlock(b, epigraphGroupStartIndex + i))}
            </div>,
          )
          epigraphGroupStartIndex = -1
        }
      } else {
        elements.push(renderBlock(block, idx))
      }
    })

    const duplicateBlock =
      duplicateTitleIndex !== -1 ? normalizeCaps(content[duplicateTitleIndex]!) : undefined

    return (
      <div className={proseClasses}>
        <h2 className="mb-6 text-xl font-semibold">
          {duplicateBlock?.segments ? (
            <SegmentList
              segments={duplicateBlock.segments}
              currentParagraph={currentParagraph}
              onParagraphClick={onParagraphClick}
              onParagraphContextMenu={onParagraphContextMenu}
              currentChapter={currentChapter}
              paragraphRef={currentParagraphRef}
              bookmarkedParagraphs={bookmarkedParagraphs}
            />
          ) : (
            chapter.title
          )}
        </h2>
        <div>{elements}</div>
      </div>
    )
  }

  // Fallback to plain paragraph rendering
  return (
    <div className={proseClasses}>
      <h2 className="mb-6 text-xl font-semibold">{chapter.title}</h2>
      <div className="leading-relaxed">
        {chapter.paragraphs.map((paragraph, idx) => {
          const isActive = idx === currentParagraph
          return (
            <span
              key={idx}
              ref={isActive ? (currentParagraphRef as React.RefObject<HTMLSpanElement>) : undefined}
              data-active-paragraph={isActive || undefined}
              onClick={() => onParagraphClick?.(currentChapter, idx)}
              className={`cursor-pointer transition-colors ${
                isActive ? `${ACTIVE_PARAGRAPH_HIGHLIGHT} -mx-1 px-1` : 'hover:bg-accent'
              }`}
            >
              {paragraph}{' '}
            </span>
          )
        })}
      </div>
    </div>
  )
}
