'use client'

import { useCallback, useRef, useEffect, useMemo } from 'react'
import type { ChapterInfo } from '@/lib/types/book'
import { getNextPosition as getNextPositionHelper } from '@/lib/helpers/getNextPosition/getNextPosition'

interface UseBookPositionOptions {
  chapters: ChapterInfo[]
  currentChapter: number
  currentSentence: number
  onProgressChange: (chapter: number, sentence: number) => void
}

export const useBookPosition = (options: UseBookPositionOptions) => {
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
  const totalSentences = chapter?.sentenceCount || 0

  const getNextPosition = useCallback(
    (ch: number, sent: number) =>
      getNextPositionHelper(chaptersRef.current, ch, sent),
    []
  )

  const skipBack = useCallback(() => {
    if (currentSentence > 0) {
      onProgressChange(currentChapter, currentSentence - 1)
    } else if (currentChapter > 0) {
      const prevChapter = chapters[currentChapter - 1]
      onProgressChange(currentChapter - 1, prevChapter.sentenceCount - 1)
    }
  }, [currentChapter, currentSentence, chapters, onProgressChange])

  const skipForward = useCallback(() => {
    const ch = chapters[currentChapter]
    if (currentSentence < ch.sentenceCount - 1) {
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

  return useMemo(
    () => ({
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
    }),
    [
      chapter,
      totalSentences,
      currentChapter,
      currentSentence,
      chapters.length,
      skipBack,
      skipForward,
      advanceToNext,
      getNextPosition,
      chaptersRef,
      currentChapterRef,
      currentSentenceRef,
      onProgressChangeRef,
    ]
  )
}
