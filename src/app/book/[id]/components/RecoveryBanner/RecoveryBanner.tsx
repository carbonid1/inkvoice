'use client'

import { Button } from '@/components/ui/Button/Button'
import { X } from 'lucide-react'
import { useState } from 'react'

type RecoveryBannerProps = {
  chapterName: string
  onNavigate: () => void
}

export const RecoveryBanner = ({ chapterName, onNavigate }: RecoveryBannerProps) => {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="animate-in fade-in slide-in-from-top-2 border-attention-border bg-attention-muted mx-6 mt-4 mb-4 flex items-center justify-between rounded-lg border p-3">
      <p className="text-attention-foreground text-sm">
        You have a bookmark at {chapterName}.{' '}
        <button
          onClick={onNavigate}
          className="text-attention-foreground hover:text-foreground font-medium underline"
        >
          Go there
        </button>
      </p>
      <Button
        variant="attention"
        size="icon"
        onClick={() => setDismissed(true)}
        className="ml-2 shrink-0"
        aria-label="Dismiss"
      >
        <X />
      </Button>
    </div>
  )
}
