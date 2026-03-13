'use client'

import { Tooltip } from '@/components/Tooltip/Tooltip'
import type { ChapterInfo } from '@/lib/types/book'
import { computeChapterPagePosition } from '../../helpers/computeChapterPagePosition/computeChapterPagePosition'
import { computeChapterProgressPercent } from '../../helpers/computeChapterProgressPercent/computeChapterProgressPercent'
import { shouldShowChapterProgress } from '../../helpers/shouldShowChapterProgress/shouldShowChapterProgress'

type ProgressIndicatorProps = {
  paragraph: number
  chapterInfo: ChapterInfo
}

export const ProgressIndicator = ({ paragraph, chapterInfo }: ProgressIndicatorProps) => {
  const chapterPercent =
    computeChapterProgressPercent({ paragraph, paragraphsInChapter: chapterInfo.paragraphCount }) ??
    0
  const showChapterBar = shouldShowChapterProgress({ wordsInChapter: chapterInfo.wordCount })
  const chapterPagePosition = showChapterBar
    ? computeChapterPagePosition({
        paragraph,
        paragraphCount: chapterInfo.paragraphCount,
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
              className="h-0.5 bg-muted transition-shadow duration-200 group-hover/bar:shadow-[0_-3px_10px_rgba(59,130,246,0.25)] dark:group-hover/bar:shadow-[0_-3px_10px_rgba(59,130,246,0.4)] motion-reduce:transition-none"
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
