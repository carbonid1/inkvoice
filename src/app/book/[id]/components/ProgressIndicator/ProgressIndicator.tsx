'use client'

import { computeProgressPercent } from '@/lib/helpers/computeProgressPercent/computeProgressPercent'
import { useDisplayStore } from '@/store/useDisplayStore'
import type { Progress } from '@/store/useProgressStore'
import { computePagePosition } from '../../helpers/computePagePosition/computePagePosition'

type ProgressIndicatorProps = {
  chapter: number
  sentence: number
  progress: Progress
}

export const ProgressIndicator = ({ chapter, sentence, progress }: ProgressIndicatorProps) => {
  const progressDisplay = useDisplayStore(s => s.progressDisplay)
  const showBar = progressDisplay === 'bar' || progressDisplay === 'both'
  const showPages = progressDisplay === 'pages' || progressDisplay === 'both'

  const progressPercent = computeProgressPercent(progress) ?? 0

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
      {showPages && pagePosition && (
        <div className="max-w-3xl mx-auto px-4 pb-1">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
            Page {pagePosition.currentPage} of {pagePosition.totalPages}
          </p>
        </div>
      )}

      {showBar && (
        <div className="h-0.5 bg-gray-100 dark:bg-gray-800">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </>
  )
}
