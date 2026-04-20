'use client'

import { Button } from '@carbonid1/design-system'
import { Undo2, X } from 'lucide-react'

type ReturnPillProps = {
  chapterName: string
  onNavigate: () => void
  onDismiss: () => void
}

export const ReturnPill = ({ chapterName, onNavigate, onDismiss }: ReturnPillProps) => {
  return (
    <div
      role="status"
      className="animate-in fade-in slide-in-from-bottom-4 fixed bottom-20 left-1/2 z-30 -translate-x-1/2 duration-200"
    >
      <div className="border-border bg-background flex items-center gap-2 rounded-full border py-2 pr-2 pl-4 shadow-lg">
        <button
          onClick={onNavigate}
          className="hover:text-foreground flex items-center gap-2 transition-colors"
          aria-label={`Return to ${chapterName}`}
        >
          <Undo2 className="size-4 shrink-0" />
          <span className="max-w-48 truncate text-sm">Back to {chapterName}</span>
        </button>
        <Button
          size="smallIcon"
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground shrink-0"
          aria-label="Dismiss"
        >
          <X />
        </Button>
      </div>
    </div>
  )
}
