'use client'

import { Tooltip } from '@/components/Tooltip/Tooltip'
import type { ChapterInfo } from '@/lib/types/book'
import type { Progress } from '@/store/useProgressStore'
import { computeChapterPagePosition } from '../../helpers/computeChapterPagePosition/computeChapterPagePosition'
import { computeChapterProgressPercent } from '../../helpers/computeChapterProgressPercent/computeChapterProgressPercent'
import { computePagePosition } from '../../helpers/computePagePosition/computePagePosition'
import { shouldShowChapterProgress } from '../../helpers/shouldShowChapterProgress/shouldShowChapterProgress'

type ProgressIndicatorProps = {
  chapter: number
  sentence: number
  progress: Progress
  chapterInfo: ChapterInfo
}

export const ProgressIndicator = ({
  chapter,
  sentence,
  progress,
  chapterInfo,
}: ProgressIndicatorProps) => {
  const chapterPercent =
    computeChapterProgressPercent({ sentence, sentencesInChapter: chapterInfo.sentenceCount }) ?? 0
  const showChapterBar = shouldShowChapterProgress({ wordsInChapter: chapterInfo.wordCount })
  const chapterPagePosition = showChapterBar
    ? computeChapterPagePosition({
        sentence,
        sentenceCount: chapterInfo.sentenceCount,
        wordCount: chapterInfo.wordCount,
      })
    : null

  const pagePosition =
    progress.wordsPerChapter && progress.sentencesPerChapter
      ? computePagePosition({
          chapter,
          sentence,
          wordsPerChapter: progress.wordsPerChapter,
          sentencesPerChapter: progress.sentencesPerChapter,
        })
      : null

  return (
    <>
      {pagePosition && (
        <div className="max-w-3xl mx-auto px-4 pb-1">
          <div className="flex justify-end">
            <Tooltip label="Based on 350 words per page" position="bottom">
              <p className="text-xs text-gray-400 dark:text-gray-400 cursor-default">
                Page {pagePosition.currentPage} of {pagePosition.totalPages}
              </p>
            </Tooltip>
          </div>
        </div>
      )}

      {showChapterBar && (
        <Tooltip
          label={
            chapterPagePosition
              ? `Chapter page ${chapterPagePosition.currentPage} of ${chapterPagePosition.totalPages}`
              : `${chapterPercent}% through chapter`
          }
          position="bottom"
          delay={600}
          className="w-full [display:flex] -mt-3"
        >
          <div className="w-full pt-3 cursor-default group/bar">
            <div
              className="h-0.5 bg-gray-100 dark:bg-gray-800 transition-shadow duration-200 group-hover/bar:shadow-[0_-3px_10px_rgba(59,130,246,0.25)] dark:group-hover/bar:shadow-[0_-3px_10px_rgba(59,130,246,0.4)] motion-reduce:transition-none"
              aria-hidden="true"
            >
              <div
                className="h-full bg-blue-500 transition-[width] duration-300"
                style={{ width: `${chapterPercent}%` }}
              />
            </div>
            <span className="sr-only">{chapterPercent}% through chapter</span>
          </div>
        </Tooltip>
      )}
    </>
  )
}
