'use client'

import { Tooltip } from '@carbonid1/design-system'
import type { ChapterInfo } from '@/lib/types/book'
import { computeChapterPagePosition } from '../../helpers/computeChapterPagePosition/computeChapterPagePosition'
import { computeChapterProgressPercent } from '../../helpers/computeChapterProgressPercent/computeChapterProgressPercent'
import { shouldShowChapterProgress } from '../../helpers/shouldShowChapterProgress/shouldShowChapterProgress'

interface ProgressIndicatorProps {
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
          className="-mt-3 [display:flex] w-full"
        >
          <div className="group/bar w-full cursor-default pt-3">
            <div
              className="bg-muted h-0.5 transition-shadow duration-200 group-hover/bar:shadow-[0_-3px_10px_rgba(59,130,246,0.25)] motion-reduce:transition-none dark:group-hover/bar:shadow-[0_-3px_10px_rgba(59,130,246,0.4)]"
              aria-hidden="true"
            >
              <div
                className="bg-primary h-full transition-[width] duration-300"
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
