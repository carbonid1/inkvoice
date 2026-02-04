'use client'

interface PlaybackControlsProps {
  isPlaying: boolean
  isLoading: boolean
  onPlayPause: () => void
  onSkipBack: () => void
  onSkipForward: () => void
}

export function PlaybackControls({
  isPlaying,
  isLoading,
  onPlayPause,
  onSkipBack,
  onSkipForward,
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={onSkipBack}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Previous sentence"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <button
        onClick={onPlayPause}
        className="p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors relative"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isLoading && (
          <svg
            className="w-6 h-6 animate-spin absolute inset-0 m-auto"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {isPlaying ? (
          <svg
            className={`w-6 h-6 ${isLoading ? 'opacity-30' : ''}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg
            className={`w-6 h-6 ${isLoading ? 'opacity-30' : ''}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <button
        onClick={onSkipForward}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Next sentence"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  )
}
