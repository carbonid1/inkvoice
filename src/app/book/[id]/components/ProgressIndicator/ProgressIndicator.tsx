'use client'

import { Tooltip } from '@/components/Tooltip/Tooltip'
import type { ChapterInfo } from '@/lib/types/book'
import { computeChapterPagePosition } from '../../helpers/computeChapterPagePosition/computeChapterPagePosition'
import { computeChapterProgressPercent } from '../../helpers/computeChapterProgressPercent/computeChapterProgressPercent'
import { shouldShowChapterProgress } from '../../helpers/shouldShowChapterProgress/shouldShowChapterProgress'

type ProgressIndicatorProps = {
  sentence: number
  chapterInfo: ChapterInfo
}

export const ProgressIndicator = ({ sentence, chapterInfo }: ProgressIndicatorProps) => {
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

  return (
    <>
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
