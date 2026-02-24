'use client'

import { SpeakerIcon } from '@/components/icons/SpeakerIcon'
import { SpinnerIcon } from '@/components/icons/SpinnerIcon'
import { StopIcon } from '@/components/icons/StopIcon'
import { usePronunciationStore } from '@/store/usePronunciationStore'
import { useVoiceStore } from '@/store/useVoiceStore'
import { useCallback, useEffect, useRef, useState } from 'react'

type PronunciationMap = Record<string, string>

export const PronunciationEditor = () => {
  const [entries, setEntries] = useState<PronunciationMap>({})
  const bumpVersion = usePronunciationStore(s => s.bumpVersion)
  const [loading, setLoading] = useState(true)
  const [newWord, setNewWord] = useState('')
  const [newPronunciation, setNewPronunciation] = useState('')
  const [previewingText, setPreviewingText] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const voice = useVoiceStore(s => s.voice)

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

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

  const playPreview = useCallback(
    async (text: string) => {
      // Toggle off if already playing this text
      if (previewingText === text) {
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current = null
        }
        setPreviewingText(null)
        return
      }

      // Stop any current playback
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      setPreviewingText(text)
      setPreviewLoading(true)

      try {
        const response = await fetch('/api/tts/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice }),
          cache: 'no-store',
        })

        if (!response.ok) {
          console.error('TTS preview failed:', response.status)
          setPreviewingText(null)
          setPreviewLoading(false)
          return
        }

        const blob = await response.blob()
        const url = URL.createObjectURL(blob)

        const audio = new Audio(url)
        audioRef.current = audio

        audio.onended = () => {
          setPreviewingText(null)
          URL.revokeObjectURL(url)
        }

        audio.onerror = () => {
          setPreviewingText(null)
          setPreviewLoading(false)
          URL.revokeObjectURL(url)
        }

        setPreviewLoading(false)
        await audio.play()
      } catch {
        setPreviewingText(null)
        setPreviewLoading(false)
      }
    },
    [previewingText, voice],
  )

  const saveEntries = useCallback(
    async (updated: PronunciationMap) => {
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
    },
    [bumpVersion],
  )

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

  const getPreviewIcon = (text: string) => {
    if (previewingText === text && previewLoading) {
      return <SpinnerIcon className="w-3.5 h-3.5 animate-spin" />
    }
    if (previewingText === text) {
      return <StopIcon className="w-3.5 h-3.5" />
    }
    return <SpeakerIcon className="w-3.5 h-3.5" />
  }

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
              {sortedWords.map(word => {
                const pronunciation = entries[word] ?? ''
                return (
                  <div key={word} className="flex items-center gap-3 text-sm">
                    <span className="font-medium min-w-[120px]">{word}</span>
                    <span className="text-gray-500 dark:text-gray-400">&rarr;</span>
                    <span className="flex-1 text-gray-700 dark:text-gray-300">{pronunciation}</span>
                    <button
                      onClick={() => playPreview(pronunciation)}
                      className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                      title={`Preview "${pronunciation}"`}
                    >
                      {getPreviewIcon(pronunciation)}
                    </button>
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
                )
              })}
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
              onClick={() => playPreview(newPronunciation.trim())}
              disabled={!newPronunciation.trim()}
              className="p-2 text-gray-400 hover:text-blue-500 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
              title="Preview pronunciation"
            >
              {getPreviewIcon(newPronunciation.trim())}
            </button>
            <button
              onClick={handleAdd}
              disabled={!newWord.trim() || !newPronunciation.trim()}
              className="px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Add
            </button>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pronunciation overrides replace words before TTS generation. Changes automatically apply
            on next playback.
          </p>
        </div>
      )}
    </div>
  )
}
