'use client'

import { useCallback, useRef, useEffect } from 'react'
import type { ParsedChapter } from '@/lib/types/book'

interface UseBookPositionOptions {
  chapters: ParsedChapter[]
  currentChapter: number
  currentSentence: number
  onProgressChange: (chapter: number, sentence: number) => void
}

export function useBookPosition(options: UseBookPositionOptions) {
  const { chapters, currentChapter, currentSentence, onProgressChange } = options

  // Keep refs in sync for use in callbacks
  const chaptersRef = useRef(chapters)
  const currentChapterRef = useRef(currentChapter)
  const currentSentenceRef = useRef(currentSentence)
  const onProgressChangeRef = useRef(onProgressChange)

  useEffect(() => {
    chaptersRef.current = chapters
    currentChapterRef.current = currentChapter
    currentSentenceRef.current = currentSentence
    onProgressChangeRef.current = onProgressChange
  }, [chapters, currentChapter, currentSentence, onProgressChange])

  const chapter = chapters[currentChapter]
  const totalSentences = chapter?.sentences.length || 0

  const getNextPosition = useCallback(
    (ch: number, sent: number): { ch: number; sent: number } | null => {
      const nextSent = sent + 1
      const chapterData = chaptersRef.current[ch]

      if (chapterData && nextSent < chapterData.sentences.length) {
        return { ch, sent: nextSent }
      }

      const nextCh = ch + 1
      if (nextCh < chaptersRef.current.length) {
        return { ch: nextCh, sent: 0 }
      }

      return null // End of book
    },
    []
  )

  const skipBack = useCallback(() => {
    if (currentSentence > 0) {
      onProgressChange(currentChapter, currentSentence - 1)
    } else if (currentChapter > 0) {
      const prevChapter = chapters[currentChapter - 1]
      onProgressChange(currentChapter - 1, prevChapter.sentences.length - 1)
    }
  }, [currentChapter, currentSentence, chapters, onProgressChange])

  const skipForward = useCallback(() => {
    const ch = chapters[currentChapter]
    if (currentSentence < ch.sentences.length - 1) {
      onProgressChange(currentChapter, currentSentence + 1)
    } else if (currentChapter < chapters.length - 1) {
      onProgressChange(currentChapter + 1, 0)
    }
  }, [currentChapter, currentSentence, chapters, onProgressChange])

  const advanceToNext = useCallback((): boolean => {
    const next = getNextPosition(
      currentChapterRef.current,
      currentSentenceRef.current
    )
    if (next) {
      onProgressChangeRef.current(next.ch, next.sent)
      return true
    }
    return false // End of book
  }, [getNextPosition])

  return {
    chapter,
    totalSentences,
    currentChapter,
    currentSentence,
    totalChapters: chapters.length,
    skipBack,
    skipForward,
    advanceToNext,
    getNextPosition,
    // Expose refs for prefetch queue
    chaptersRef,
    currentChapterRef,
    currentSentenceRef,
    onProgressChangeRef,
  }
}
