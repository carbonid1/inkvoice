'use client'

import { useDisplayStore } from '@/store/useDisplayStore'

const OPTIONS = [
  { value: 'sentence', label: 'Sentence' },
  { value: 'paragraph', label: 'Paragraph' },
] as const

export const ChunkingModeCard = () => {
  const chunkingMode = useDisplayStore(s => s.chunkingMode)
  const setChunkingMode = useDisplayStore(s => s.setChunkingMode)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold mb-4">Chunking Mode</h2>
      <fieldset className="space-y-3">
        {OPTIONS.map(option => (
          <label key={option.value} className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="chunking-mode"
              value={option.value}
              checked={chunkingMode === option.value}
              onChange={() => setChunkingMode(option.value)}
              className="w-4 h-4 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
          </label>
        ))}
      </fieldset>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
        Sentence mode generates one audio clip per sentence. Paragraph mode groups sentences into
        longer clips, reducing pauses between sentences.
      </p>
    </div>
  )
}
