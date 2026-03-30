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
    <div className="bg-[color-mix(in_oklch,var(--attention)_15%,transparent)] border border-[color-mix(in_oklch,var(--attention)_30%,transparent)] rounded-lg p-3 mx-6 mt-4 mb-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
      <p className="text-sm text-attention-foreground">
        You have a bookmark at {chapterName}.{' '}
        <button
          onClick={onNavigate}
          className="text-attention-foreground underline hover:text-foreground font-medium"
        >
          Go there
        </button>
      </p>
      <Button
        variant="attention"
        size="icon"
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 ml-2"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}
