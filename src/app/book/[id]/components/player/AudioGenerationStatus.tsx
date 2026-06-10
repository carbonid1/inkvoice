'use client'

import { Button } from '@carbonid1/design-system'
import { AudioLines, Loader2 } from 'lucide-react'

export interface AudioGenerationStatusProps {
  message: string
  pending?: boolean
  onGenerateFromHere?: () => void
}

/**
 * Player-bar explanation for a paragraph that has no audio yet: why playback
 * is blocked, how far away generation is, and the way out. While `pending`,
 * generation has been pointed at this paragraph and playback starts on its own.
 */
export const AudioGenerationStatus = ({
  message,
  pending = false,
  onGenerateFromHere,
}: AudioGenerationStatusProps) => (
  <div
    aria-live="polite"
    className="text-muted-foreground mb-2 flex min-h-7 flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm"
  >
    {pending && <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />}
    <span>{message}</span>
    {onGenerateFromHere && (
      <Button size="small" onClick={onGenerateFromHere} className="shrink-0">
        <AudioLines />
        Generate from here
      </Button>
    )}
  </div>
)
