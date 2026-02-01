'use client'

import { useEffect, useRef, RefObject } from 'react'
import { ParsedChapter, ContentBlock, TextSegment } from '@/lib/epub'

interface ReaderProps {
  chapters: ParsedChapter[]
  currentChapter: number
  currentSentence: number
  onSentenceClick?: (chapter: number, sentence: number) => void
}

// Check if a block looks like a section title (short, all-caps text)
// Works for both headings and paragraphs styled as titles
function isSectionTitle(block: ContentBlock): boolean {
  if (block.type !== 'heading' && block.type !== 'paragraph') return false
  const text = block.segments?.map(s => s.html.replace(/<[^>]+>/g, '')).join('') || ''
  // Short text (under 50 chars) that's mostly uppercase and has letters
  const isShort = text.length > 0 && text.length < 50
  const upperCount = (text.match(/[A-Z]/g) || []).length
  const letterCount = (text.match(/[a-zA-Z]/g) || []).length
  const isMostlyUpper = letterCount > 3 && upperCount / letterCount > 0.8
  return isShort && isMostlyUpper
}

function RenderBlock({
  block,
  currentSentence,
  onSentenceClick,
  currentChapter,
  sentenceRef,
  isInTitleGroup,
  isSubtitle,
}: {
  block: ContentBlock
  currentSentence: number
  onSentenceClick?: (chapter: number, sentence: number) => void
  currentChapter: number
  sentenceRef: RefObject<HTMLSpanElement>
  isInTitleGroup?: boolean
  isSubtitle?: boolean
}) {
  const renderSegments = (segments: TextSegment[] | undefined) => {
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

  switch (block.type) {
    case 'heading': {
      const HeadingTag = `h${block.level || 2}` as keyof JSX.IntrinsicElements

      // Special styling for title groups (centered, more spacing)
      if (isInTitleGroup) {
        const titleClasses = isSubtitle
          ? 'text-lg font-medium text-gray-600 dark:text-gray-400 text-center mb-6'
          : 'text-2xl font-bold text-center mt-12 mb-2'
        return (
          <HeadingTag className={titleClasses}>
            {renderSegments(block.segments)}
          </HeadingTag>
        )
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
          {renderSegments(block.segments)}
        </HeadingTag>
      )
    }

    case 'paragraph':
      // Special styling for title groups (centered, more spacing)
      if (isInTitleGroup) {
        const titleClasses = isSubtitle
          ? 'text-lg font-medium text-gray-600 dark:text-gray-400 text-center mb-6'
          : 'text-2xl font-bold text-center mt-12 mb-2'
        return <p className={titleClasses}>{renderSegments(block.segments)}</p>
      }
      return <p className="mb-4 leading-relaxed">{renderSegments(block.segments)}</p>

    case 'blockquote':
      return (
        <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4 italic text-gray-700 dark:text-gray-300">
          {renderSegments(block.segments)}
        </blockquote>
      )

    case 'list':
      return (
        <ul className="list-disc list-inside mb-4 space-y-1">
          {block.items?.map((itemSegments, idx) => (
            <li key={idx}>{renderSegments(itemSegments)}</li>
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

  // Check if chapter has rich content
  const hasContent = chapter.content && chapter.content.length > 0

  if (hasContent) {
    // Pre-compute title groups: consecutive section-title-style headings
    const content = chapter.content!
    const titleGroupStart = new Set<number>()
    const titleGroupMember = new Set<number>()

    for (let i = 0; i < content.length; i++) {
      if (isSectionTitle(content[i])) {
        // Check if next block is also a section title
        if (i + 1 < content.length && isSectionTitle(content[i + 1])) {
          titleGroupStart.add(i)
          titleGroupMember.add(i)
          titleGroupMember.add(i + 1)
        } else if (titleGroupMember.has(i - 1) && !titleGroupStart.has(i)) {
          // Continue the group
          titleGroupMember.add(i)
        }
      }
    }

    return (
      <div className="prose prose-lg dark:prose-invert max-w-none p-6">
        <h2 className="text-xl font-semibold mb-6">{chapter.title}</h2>
        <div>
          {content.map((block, idx) => (
            <RenderBlock
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

  // Fallback to plain sentence rendering for backwards compatibility
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none p-6">
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
