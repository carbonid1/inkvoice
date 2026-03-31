'use client'

import { Tooltip } from '@/components/Tooltip/Tooltip'
import { Button } from '@/components/ui/Button/Button'
import { ChevronLeft, ChevronRight, Loader2, Pause, Play } from 'lucide-react'
import { useHotkeys } from 'react-hotkeys-hook'

type PlaybackControlsProps = {
  isPlaying: boolean
  isLoading: boolean
  onPlayPause: () => void
  onSkipBack: () => void
  onSkipForward: () => void
}

export const PlaybackControls = ({
  isPlaying,
  isLoading,
  onPlayPause,
  onSkipBack,
  onSkipForward,
}: PlaybackControlsProps) => {
  useHotkeys('space', onPlayPause, { preventDefault: true })
  useHotkeys('left', onSkipBack)
  useHotkeys('right', onSkipForward)

  return (
    <div className="flex items-center justify-center gap-4">
      <Tooltip label="Previous Sentence" shortcut="←">
        <Button size="icon" onClick={onSkipBack}>
          <ChevronLeft className="size-6" />
        </Button>
      </Tooltip>

      <Tooltip label={isPlaying ? 'Pause' : 'Play'} shortcut="Space">
        <Button variant="solid" size="largeIcon" onClick={onPlayPause} className="relative">
          {isLoading && <Loader2 className="absolute inset-0 m-auto size-6 animate-spin" />}
          {isPlaying ? (
            <Pause className={`size-6 ${isLoading ? 'opacity-30' : ''}`} />
          ) : (
            <Play className={`size-6 ${isLoading ? 'opacity-30' : ''}`} />
          )}
        </Button>
      </Tooltip>

      <Tooltip label="Next Sentence" shortcut="→">
        <Button size="icon" onClick={onSkipForward}>
          <ChevronRight className="size-6" />
        </Button>
      </Tooltip>
    </div>
  )
}
