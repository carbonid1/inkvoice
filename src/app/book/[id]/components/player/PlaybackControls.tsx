'use client'

import { Tooltip } from '@/components/Tooltip/Tooltip'
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
        <button
          onClick={onSkipBack}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </Tooltip>

      <Tooltip label={isPlaying ? 'Pause' : 'Play'} shortcut="Space">
        <button
          onClick={onPlayPause}
          className="p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors relative"
        >
          {isLoading && <Loader2 className="w-6 h-6 animate-spin absolute inset-0 m-auto" />}
          {isPlaying ? (
            <Pause className={`w-6 h-6 ${isLoading ? 'opacity-30' : ''}`} />
          ) : (
            <Play className={`w-6 h-6 ${isLoading ? 'opacity-30' : ''}`} />
          )}
        </button>
      </Tooltip>

      <Tooltip label="Next Sentence" shortcut="→">
        <button
          onClick={onSkipForward}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </Tooltip>
    </div>
  )
}
