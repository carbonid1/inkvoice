'use client'

import { useHotkeys } from 'react-hotkeys-hook'
import type { ChapterEndModalProps } from './ChapterEndModal.types'

export const ChapterEndModal = ({
  isOpen,
  completedChapterTitle,
  nextChapterTitle,
  chaptersCompleted,
  totalChapters,
  onContinue,
  onDismiss,
}: ChapterEndModalProps) => {
  useHotkeys('escape', onDismiss, { enabled: isOpen })

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="chapter-end-backdrop"
        className="fixed inset-0 bg-black/20 z-30 transition-opacity duration-200 ease-out"
        onClick={onDismiss}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-labelledby="chapter-end-title"
        className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
      >
        <div className="pointer-events-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full mx-4 p-8 text-center motion-safe:animate-[fadeScaleIn_200ms_ease-out]">
          {/* Section break ornament */}
          <div className="text-gray-300 dark:text-gray-600 text-lg tracking-[0.5em] mb-6">
            * * *
          </div>

          {/* Completed chapter */}
          <h2 id="chapter-end-title" className="font-medium text-gray-900 dark:text-gray-100">
            {completedChapterTitle}
          </h2>

          {/* Divider */}
          <div className="my-5 border-t border-gray-100 dark:border-gray-700" />

          {/* Next chapter */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Up next</p>
          <p className="font-medium text-gray-900 dark:text-gray-100">{nextChapterTitle}</p>

          {/* Progress */}
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-4">
            Chapter {chaptersCompleted} of {totalChapters}
          </p>

          {/* Continue button */}
          <button
            onClick={onContinue}
            autoFocus
            className="mt-6 w-full px-4 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Continue to Next Chapter
          </button>
        </div>
      </div>
    </>
  )
}
