'use client'

import { ChevronLeftIcon } from '@/components/icons/ChevronLeftIcon'
import { ChevronRightIcon } from '@/components/icons/ChevronRightIcon'
import { PauseIcon } from '@/components/icons/PauseIcon'
import { PlayIcon } from '@/components/icons/PlayIcon'
import { SpinnerIcon } from '@/components/icons/SpinnerIcon'
import { Tooltip } from '@/components/Tooltip/Tooltip'
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
      <Tooltip label="Previous Sentence" shortcut="←" position="top">
        <button
          onClick={onSkipBack}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
      </Tooltip>

      <Tooltip label={isPlaying ? 'Pause' : 'Play'} shortcut="Space" position="top">
        <button
          onClick={onPlayPause}
          className="p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors relative"
        >
          {isLoading && <SpinnerIcon className="w-6 h-6 animate-spin absolute inset-0 m-auto" />}
          {isPlaying ? (
            <PauseIcon className={`w-6 h-6 ${isLoading ? 'opacity-30' : ''}`} />
          ) : (
            <PlayIcon className={`w-6 h-6 ${isLoading ? 'opacity-30' : ''}`} />
          )}
        </button>
      </Tooltip>

      <Tooltip label="Next Sentence" shortcut="→" position="top">
        <button
          onClick={onSkipForward}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronRightIcon />
        </button>
      </Tooltip>
    </div>
  )
}
