'use client'

import { useDisplayStore } from '@/store/useDisplayStore'

const OPTIONS = [
  { value: 'bar', label: 'Progress bar only' },
  { value: 'pages', label: 'Page numbers only' },
  { value: 'both', label: 'Progress bar and page numbers' },
] as const

export const ProgressDisplayCard = () => {
  const progressDisplay = useDisplayStore(s => s.progressDisplay)
  const setProgressDisplay = useDisplayStore(s => s.setProgressDisplay)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold mb-4">Progress Display</h2>
      <fieldset className="space-y-3">
        {OPTIONS.map(option => (
          <label key={option.value} className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="progress-display"
              value={option.value}
              checked={progressDisplay === option.value}
              onChange={() => setProgressDisplay(option.value)}
              className="w-4 h-4 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
          </label>
        ))}
      </fieldset>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
        Page estimates are based on 350 words per page, consistent across all books.
      </p>
    </div>
  )
}
