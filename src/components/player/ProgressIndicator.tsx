'use client'

interface ProgressIndicatorProps {
  currentSentence: number
  totalSentences: number
  currentChapter: number
  totalChapters: number
}

export function ProgressIndicator({
  currentSentence,
  totalSentences,
  currentChapter,
  totalChapters,
}: ProgressIndicatorProps) {
  return (
    <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
      Sentence {currentSentence + 1} of {totalSentences}
      {totalChapters > 1 && (
        <span className="ml-2">
          (Chapter {currentChapter + 1} of {totalChapters})
        </span>
      )}
    </div>
  )
}
