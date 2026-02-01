'use client'

import { useEffect, useRef } from 'react'
import { ParsedChapter } from '@/lib/epub'

interface ReaderProps {
  chapters: ParsedChapter[]
  currentChapter: number
  currentSentence: number
  onSentenceClick?: (chapter: number, sentence: number) => void
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
