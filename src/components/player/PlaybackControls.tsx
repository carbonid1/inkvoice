'use client'

import { ChevronLeftIcon } from '@/components/icons/ChevronLeftIcon'
import { ChevronRightIcon } from '@/components/icons/ChevronRightIcon'
import { PlayIcon } from '@/components/icons/PlayIcon'
import { PauseIcon } from '@/components/icons/PauseIcon'
import { SpinnerIcon } from '@/components/icons/SpinnerIcon'

interface PlaybackControlsProps {
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
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={onSkipBack}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Previous sentence"
      >
        <ChevronLeftIcon className="w-6 h-6" />
      </button>

      <button
        onClick={onPlayPause}
        className="p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors relative"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isLoading && (
          <SpinnerIcon className="w-6 h-6 animate-spin absolute inset-0 m-auto" />
        )}
        {isPlaying ? (
          <PauseIcon className={`w-6 h-6 ${isLoading ? 'opacity-30' : ''}`} />
        ) : (
          <PlayIcon className={`w-6 h-6 ${isLoading ? 'opacity-30' : ''}`} />
        )}
      </button>

      <button
        onClick={onSkipForward}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Next sentence"
      >
        <ChevronRightIcon />
      </button>
    </div>
  )
}
