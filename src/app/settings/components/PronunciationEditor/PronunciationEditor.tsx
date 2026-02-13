'use client'

import { usePronunciationStore } from '@/store/usePronunciationStore'
import { useCallback, useEffect, useState } from 'react'

type PronunciationMap = Record<string, string>

export const PronunciationEditor = () => {
  const [entries, setEntries] = useState<PronunciationMap>({})
  const bumpVersion = usePronunciationStore(s => s.bumpVersion)
  const [loading, setLoading] = useState(true)
  const [newWord, setNewWord] = useState('')
  const [newPronunciation, setNewPronunciation] = useState('')

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await fetch('/api/pronunciations')
        if (response.ok) {
          const data = await response.json()
          setEntries(data)
        }
      } catch (e) {
        console.error('Failed to fetch pronunciations:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchEntries()
  }, [])

  const saveEntries = useCallback(async (updated: PronunciationMap) => {
    try {
      await fetch('/api/pronunciations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: updated }),
      })
      bumpVersion()
    } catch (e) {
      console.error('Failed to save pronunciations:', e)
    }
  }, [bumpVersion])

  const handleAdd = useCallback(() => {
    const word = newWord.trim()
    const pronunciation = newPronunciation.trim()
    if (!word || !pronunciation) return

    const updated = { ...entries, [word]: pronunciation }
    setEntries(updated)
    setNewWord('')
    setNewPronunciation('')
    saveEntries(updated)
  }, [entries, newWord, newPronunciation, saveEntries])

  const handleDelete = useCallback(
    (word: string) => {
      const { [word]: _, ...rest } = entries
      setEntries(rest)
      saveEntries(rest)
    },
    [entries, saveEntries],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleAdd()
      }
    },
    [handleAdd],
  )

  const sortedWords = Object.keys(entries).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  )

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold mb-4">Pronunciations</h2>

      {loading ? (
        <div className="text-gray-500">Loading pronunciations...</div>
      ) : (
        <div className="space-y-4">
          {sortedWords.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No pronunciation overrides yet
            </p>
          ) : (
            <div className="space-y-2">
              {sortedWords.map(word => (
                <div
                  key={word}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="font-medium min-w-[120px]">{word}</span>
                  <span className="text-gray-500 dark:text-gray-400">→</span>
                  <span className="flex-1 text-gray-700 dark:text-gray-300">
                    {entries[word]}
                  </span>
                  <button
                    onClick={() => handleDelete(word)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title={`Remove "${word}"`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={newWord}
              onChange={e => setNewWord(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Word"
              className="flex-1 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              value={newPronunciation}
              onChange={e => setNewPronunciation(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pronunciation"
              className="flex-1 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleAdd}
              disabled={!newWord.trim() || !newPronunciation.trim()}
              className="px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Add
            </button>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pronunciation overrides replace words before TTS generation. Changes automatically
            apply on next playback.
          </p>
        </div>
      )}
    </div>
  )
}
