'use client'

import { Undo2, X } from 'lucide-react'
import type { ReturnPillProps } from './ReturnPill.types'

export const ReturnPill = ({ chapterName, onNavigate, onDismiss }: ReturnPillProps) => {
  return (
    <div
      role="status"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="flex items-center gap-2 rounded-full bg-background border border-border shadow-lg pl-4 pr-2 py-2">
        <button
          onClick={onNavigate}
          className="flex items-center gap-2 hover:text-foreground transition-colors cursor-pointer"
          aria-label={`Return to ${chapterName}`}
        >
          <Undo2 className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm truncate max-w-48">Back to {chapterName}</span>
        </button>
        <button
          onClick={onDismiss}
          className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-accent transition-colors flex-shrink-0 cursor-pointer"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
