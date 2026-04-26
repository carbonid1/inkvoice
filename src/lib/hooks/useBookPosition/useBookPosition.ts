'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { getNextPosition as getNextPositionHelper } from '@/lib/helpers/getNextPosition/getNextPosition'
import type { ChapterInfo } from '@/lib/types/book'

interface UseBookPositionOptions {
  chapters: ChapterInfo[]
  currentChapter: number
  currentParagraph: number
  onProgressChange: (chapter: number, paragraph: number) => void
}

export const useBookPosition = (options: UseBookPositionOptions) => {
  const { chapters, currentChapter, currentParagraph, onProgressChange } = options

  // Keep refs in sync for use in callbacks
  const chaptersRef = useRef(chapters)
  const currentChapterRef = useRef(currentChapter)
  const currentParagraphRef = useRef(currentParagraph)
  const onProgressChangeRef = useRef(onProgressChange)

  useEffect(() => {
    chaptersRef.current = chapters
    currentChapterRef.current = currentChapter
    currentParagraphRef.current = currentParagraph
    onProgressChangeRef.current = onProgressChange
  }, [chapters, currentChapter, currentParagraph, onProgressChange])

  const chapter = chapters[currentChapter]
  const totalParagraphs = chapter?.paragraphCount || 0

  const getNextPosition = useCallback(
    (ch: number, para: number) => getNextPositionHelper(chaptersRef.current, ch, para),
    [],
  )

  const skipBack = useCallback(() => {
    if (currentParagraph > 0) {
      onProgressChange(currentChapter, currentParagraph - 1)
    } else if (currentChapter > 0) {
      const prevChapter = chapters[currentChapter - 1]

      if (prevChapter) {
        onProgressChange(currentChapter - 1, prevChapter.paragraphCount - 1)
      }
    }
  }, [currentChapter, currentParagraph, chapters, onProgressChange])

  const skipForward = useCallback(() => {
    const ch = chapters[currentChapter]

    if (ch && currentParagraph < ch.paragraphCount - 1) {
      onProgressChange(currentChapter, currentParagraph + 1)
    } else if (currentChapter < chapters.length - 1) {
      onProgressChange(currentChapter + 1, 0)
    }
  }, [currentChapter, currentParagraph, chapters, onProgressChange])

  const advanceToNext = useCallback((): boolean => {
    const next = getNextPosition(currentChapterRef.current, currentParagraphRef.current)

    if (next) {
      onProgressChangeRef.current(next.ch, next.para)
      return true
    }
    return false // End of book
  }, [getNextPosition])

  return useMemo(
    () => ({
      chapter,
      totalParagraphs,
      currentChapter,
      currentParagraph,
      totalChapters: chapters.length,
      skipBack,
      skipForward,
      advanceToNext,
      getNextPosition,
      // Expose refs for prefetch queue
      chaptersRef,
      currentChapterRef,
      currentParagraphRef,
      onProgressChangeRef,
    }),
    [
      chapter,
      totalParagraphs,
      currentChapter,
      currentParagraph,
      chapters.length,
      skipBack,
      skipForward,
      advanceToNext,
      getNextPosition,
      chaptersRef,
      currentChapterRef,
      currentParagraphRef,
      onProgressChangeRef,
    ],
  )
}
