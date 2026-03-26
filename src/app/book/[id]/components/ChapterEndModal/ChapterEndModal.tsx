'use client'

import { Button } from '@/components/ui/Button/Button'
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
          <Button
            variant="primary"
            size="large"
            fullWidth
            onClick={onContinue}
            autoFocus
            className="mt-6"
          >
            Continue to Next Chapter
          </Button>
        </div>
      </div>
    </>
  )
}
