'use client'

import type { ContentBlock as ContentBlockType, ParsedChapter } from '@/lib/types/book'
import { type ReactNode, useEffect, useRef } from 'react'
import { ContentBlock } from './reader/ContentBlock'

interface ReaderProps {
  chapter: ParsedChapter
  currentChapter: number
  currentSentence: number
  onSentenceClick?: (chapter: number, sentence: number) => void
}

const isSectionTitle = (block: ContentBlockType): boolean => {
  if (block.type !== 'heading' && block.type !== 'paragraph') return false
  const text = block.segments?.map(s => s.html.replace(/<[^>]+>/g, '')).join('') || ''
  const isShort = text.length > 0 && text.length < 50
  const upperCount = (text.match(/[A-Z]/g) || []).length
  const letterCount = (text.match(/[a-zA-Z]/g) || []).length
  const isMostlyUpper = letterCount > 3 && upperCount / letterCount > 0.8
  return isShort && isMostlyUpper
}

export const Reader = ({
  chapter,
  currentChapter,
  currentSentence,
  onSentenceClick,
}: ReaderProps) => {
  const currentSentenceRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (currentSentenceRef.current) {
      currentSentenceRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [currentChapter, currentSentence])

  if (!chapter) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No content available
      </div>
    )
  }

  const hasContent = chapter.content && chapter.content.length > 0
  const proseClasses =
    'prose prose-lg dark:prose-invert max-w-none p-6 [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline [&_a]:decoration-blue-300 [&_a]:dark:decoration-blue-600 [&_a]:underline-offset-2 [&_a]:hover:text-blue-800 [&_a]:dark:hover:text-blue-300 [&_a]:hover:decoration-blue-500 [&_a]:transition-colors'

  if (hasContent) {
    const content = chapter.content!
    const titleGroupStart = new Set<number>()
    const titleGroupMember = new Set<number>()

    for (let i = 0; i < content.length; i++) {
      const block = content[i]
      const nextBlock = content[i + 1]
      if (block && isSectionTitle(block)) {
        if (nextBlock && isSectionTitle(nextBlock)) {
          titleGroupStart.add(i)
          titleGroupMember.add(i)
          titleGroupMember.add(i + 1)
        } else if (titleGroupMember.has(i - 1) && !titleGroupStart.has(i)) {
          titleGroupMember.add(i)
        }
      }
    }

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

    const renderBlock = (block: ContentBlockType, idx: number) => (
      <ContentBlock
        key={idx}
        block={block}
        currentSentence={currentSentence}
        onSentenceClick={onSentenceClick}
        currentChapter={currentChapter}
        sentenceRef={currentSentenceRef}
        isInTitleGroup={titleGroupMember.has(idx)}
        isSubtitle={titleGroupMember.has(idx) && !titleGroupStart.has(idx)}
      />
    )

    // Build rendered elements, wrapping epigraph groups
    const elements: ReactNode[] = []
    let epigraphGroupStartIndex = -1

    content.forEach((block, idx) => {
      if (epigraphGroupMember.has(idx)) {
        if (epigraphGroupStartIndex === -1) epigraphGroupStartIndex = idx
        // Check if next block is NOT in epigraph group (end of group)
        if (!epigraphGroupMember.has(idx + 1)) {
          elements.push(
            <div
              key={`epigraph-${epigraphGroupStartIndex}`}
              className="mt-4 pb-6 mb-6 border-gray-200 dark:border-gray-700"
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

    return (
      <div className={proseClasses}>
        <h2 className="text-xl font-semibold mb-6">{chapter.title}</h2>
        <div>{elements}</div>
      </div>
    )
  }

  // Fallback to plain sentence rendering
  return (
    <div className={proseClasses}>
      <h2 className="text-xl font-semibold mb-6">{chapter.title}</h2>
      <div className="leading-relaxed">
        {chapter.sentences.map((sentence, idx) => {
          const isActive = idx === currentSentence
          return (
            <span
              key={idx}
              ref={isActive ? currentSentenceRef : undefined}
              onClick={() => onSentenceClick?.(currentChapter, idx)}
              className={`cursor-pointer transition-colors ${
                isActive
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded px-1 -mx-1'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {sentence}{' '}
            </span>
          )
        })}
      </div>
    </div>
  )
}
