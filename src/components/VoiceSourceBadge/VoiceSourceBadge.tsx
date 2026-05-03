'use client'

import { cn, Tooltip } from '@carbonid1/design-system'
import { Sparkles } from 'lucide-react'
import type { VoiceSource } from '@/lib/services/voice/voice.types'

interface Props {
  source: VoiceSource
  className?: string
}

export const VoiceSourceBadge = ({ source, className }: Props) => {
  if (source !== 'design') return null

  return (
    <Tooltip label="Designed with AI">
      <span
        tabIndex={0}
        aria-label="Designed with AI"
        className={cn(
          'text-primary inline-flex shrink-0 items-center justify-center rounded-full p-0.5 outline-none',
          'focus-visible:ring-primary/40 focus-visible:ring-2',
          className,
        )}
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </Tooltip>
  )
}
