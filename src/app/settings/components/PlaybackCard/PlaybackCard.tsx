'use client'

import { usePlaybackStore } from '@/store/usePlaybackStore'

export const PlaybackCard = () => {
  const autoAdvance = usePlaybackStore(s => s.autoAdvanceChapters)
  const toggleAutoAdvance = usePlaybackStore(s => s.toggleAutoAdvance)

  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold mb-4">Playback</h2>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={autoAdvance}
          onChange={toggleAutoAdvance}
          aria-label="Auto-advance chapters"
          className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
        />
        <div>
          <span className="font-medium">Auto-advance chapters</span>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Automatically continue to the next chapter without pausing
          </p>
        </div>
      </label>
    </section>
  )
}
