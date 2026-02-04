'use client'

import { useEffect, useRef } from 'react'
import type { ParsedChapter, ContentBlock as ContentBlockType } from '@/lib/types/book'
import { ContentBlock } from './reader/ContentBlock'

interface ReaderProps {
  chapters: ParsedChapter[]
  currentChapter: number
  currentSentence: number
  onSentenceClick?: (chapter: number, sentence: number) => void
}

function isSectionTitle(block: ContentBlockType): boolean {
  if (block.type !== 'heading' && block.type !== 'paragraph') return false
  const text = block.segments?.map((s) => s.html.replace(/<[^>]+>/g, '')).join('') || ''
  const isShort = text.length > 0 && text.length < 50
  const upperCount = (text.match(/[A-Z]/g) || []).length
  const letterCount = (text.match(/[a-zA-Z]/g) || []).length
  const isMostlyUpper = letterCount > 3 && upperCount / letterCount > 0.8
  return isShort && isMostlyUpper
}

export function Reader({
  chapters,
  currentChapter,
  currentSentence,
  onSentenceClick,
}: ReaderProps) {
  const currentSentenceRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (currentSentenceRef.current) {
      currentSentenceRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [currentChapter, currentSentence])

  const chapter = chapters[currentChapter]
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
      if (isSectionTitle(content[i])) {
        if (i + 1 < content.length && isSectionTitle(content[i + 1])) {
          titleGroupStart.add(i)
          titleGroupMember.add(i)
          titleGroupMember.add(i + 1)
        } else if (titleGroupMember.has(i - 1) && !titleGroupStart.has(i)) {
          titleGroupMember.add(i)
        }
      }
    }

    return (
      <div className={proseClasses}>
        <h2 className="text-xl font-semibold mb-6">{chapter.title}</h2>
        <div>
          {content.map((block, idx) => (
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
          ))}
        </div>
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
