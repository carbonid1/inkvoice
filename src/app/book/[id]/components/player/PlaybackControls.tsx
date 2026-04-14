'use client'

import { Button, Tooltip } from '@carbonid1/design-system'
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
          <ChevronLeft />
        </Button>
      </Tooltip>

      <Tooltip label={isPlaying ? 'Pause' : 'Play'} shortcut="Space">
        <Button variant="primary" size="largeIcon" onClick={onPlayPause} className="relative">
          {isLoading && <Loader2 className="absolute inset-0 m-auto animate-spin" />}
          {isPlaying ? (
            <Pause className={isLoading ? 'opacity-30' : ''} />
          ) : (
            <Play className={isLoading ? 'opacity-30' : ''} />
          )}
        </Button>
      </Tooltip>

      <Tooltip label="Next Sentence" shortcut="→">
        <Button size="icon" onClick={onSkipForward}>
          <ChevronRight />
        </Button>
      </Tooltip>
    </div>
  )
}
