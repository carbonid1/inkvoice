'use client'

import { useHotkeys } from 'react-hotkeys-hook'
import type { ChapterEndModalProps } from './ChapterEndModal.types'

export const ChapterEndModal = ({
  isOpen,
  completedChapterTitle,
  nextChapterTitle,
  nextChapterPageCount,
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
        <div className="pointer-events-auto bg-background rounded-xl shadow-xl max-w-sm w-full mx-4 p-8 text-center motion-safe:animate-[fadeScaleIn_200ms_ease-out]">
          {/* Section break ornament */}
          <div className="text-muted-foreground text-lg tracking-[0.5em] mb-6">* * *</div>

          {/* Completed chapter */}
          <h2 id="chapter-end-title" className="font-medium text-foreground">
            {completedChapterTitle}
          </h2>

          {/* Divider */}
          <div className="my-5 border-t border-border" />

          {/* Next chapter */}
          <p className="text-sm text-muted-foreground mb-1">Up next</p>
          <p className="font-medium text-foreground">{nextChapterTitle}</p>
          {nextChapterPageCount !== null && (
            <p className="text-sm text-muted-foreground mt-1">~{nextChapterPageCount} pages</p>
          )}

          {/* Progress */}
          <p className="text-sm text-muted-foreground mt-4">
            Chapter {chaptersCompleted} of {totalChapters}
          </p>

          {/* Continue button */}
          <button
            onClick={onContinue}
            autoFocus
            className="mt-6 w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
          >
            Continue to Next Chapter
          </button>
        </div>
      </div>
    </>
  )
}
