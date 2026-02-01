'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useStore } from '@/store/useStore'

export default function Settings() {
  const [voices, setVoices] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const { voice, setVoice } = useStore()

  useEffect(() => {
    async function fetchVoices() {
      try {
        const response = await fetch('/api/voices')
        if (response.ok) {
          const data = await response.json()
          setVoices(data)
        }
      } catch (e) {
        console.error('Failed to fetch voices:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchVoices()
  }, [])

  return (
    <div className="min-h-screen p-8">
      <header className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Back to library"
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
          </Link>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Voice</h2>

          {loading ? (
            <div className="text-gray-500">Loading voices...</div>
          ) : voices.length === 0 ? (
            <div className="text-gray-500">
              <p>No voices found.</p>
              <p className="text-sm mt-2">
                Add .wav files to <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">data/voices/</code>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="voice-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select voice for TTS
                </label>
                <select
                  id="voice-select"
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {voices.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Voice changes apply to new audio generation. Cached audio will use the original voice.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
