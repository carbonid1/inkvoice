'use client'

import { ChevronLeftIcon } from '@/components/icons/ChevronLeftIcon'
import { PlayIcon } from '@/components/icons/PlayIcon'
import { StopIcon } from '@/components/icons/StopIcon'
import { VoiceSelect } from '@/components/VoiceSelect/VoiceSelect'
import { useVoices } from '@/lib/hooks/useVoices/useVoices'
import { getVoiceFallback } from '@/lib/services/voice/helpers/getVoiceFallback/getVoiceFallback'
import { useVoiceStore } from '@/store/useVoiceStore'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ChunkingModeCard } from './components/ChunkingModeCard/ChunkingModeCard'
import { ProgressDisplayCard } from './components/ProgressDisplayCard/ProgressDisplayCard'
import { PronunciationEditor } from './components/PronunciationEditor/PronunciationEditor'
import { VoiceTagCard } from './components/VoiceTagCard/VoiceTagCard'
import { VoiceUploadCard } from './components/VoiceUploadCard/VoiceUploadCard'

type PlayingState = { name: string; type: 'source' | 'sample' } | null

export default function Settings() {
  const { voices, loading, refetch } = useVoices()
  const [playingVoice, setPlayingVoice] = useState<PlayingState>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const voice = useVoiceStore(s => s.voice)
  const setVoice = useVoiceStore(s => s.setVoice)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Auto-correct stale global voice when voice list loads
  useEffect(() => {
    if (loading || voices.length === 0) return
    const voiceNames = voices.map(v => v.name)
    const fallback = getVoiceFallback(voice, voiceNames)
    if (fallback !== voice) setVoice(fallback)
  }, [loading, voices, voice, setVoice])

  const playPreview = async (voiceName: string, type: 'source' | 'sample') => {
    setPreviewError(null)

    if (playingVoice?.name === voiceName && playingVoice?.type === type) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      setPlayingVoice(null)
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
    }

    try {
      const response = await fetch(`/api/voices/${voiceName}/${type}?v=3`)
      if (!response.ok) {
        setPreviewError(`No ${type} available for "${voiceName}"`)
        setPlayingVoice(null)
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const audio = new Audio(url)
      audioRef.current = audio
      setPlayingVoice({ name: voiceName, type })

      audio.onended = () => {
        setPlayingVoice(null)
        URL.revokeObjectURL(url)
      }

      audio.onerror = () => {
        setPreviewError(`Failed to play ${type} for "${voiceName}"`)
        setPlayingVoice(null)
        URL.revokeObjectURL(url)
      }

      await audio.play()
    } catch {
      setPreviewError(`Failed to load ${type} for "${voiceName}"`)
      setPlayingVoice(null)
    }
  }

  const currentVoiceInfo = voices.find(v => v.name === voice)

  return (
    <div className="min-h-screen p-8">
      <header className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Back to library"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto space-y-6">
        {/* Voice selector */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Voice</h2>

          {loading ? (
            <div className="text-gray-500">Loading voices...</div>
          ) : voices.length === 0 ? (
            <div className="text-gray-500">
              <p>No voices found.</p>
              <p className="text-sm mt-2">
                Add voices to{' '}
                <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                  data/voices/&lt;name&gt;/source.wav
                </code>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="voice-select"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Select voice for TTS
                </label>
                <div className="flex gap-2">
                  <VoiceSelect
                    id="voice-select"
                    voices={voices}
                    value={voice}
                    onChange={setVoice}
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left"
                  />
                  <button
                    onClick={() => playPreview(voice, 'source')}
                    className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-1.5 text-sm"
                    title={
                      playingVoice?.name === voice && playingVoice?.type === 'source'
                        ? 'Stop'
                        : 'Listen to source audio'
                    }
                  >
                    {playingVoice?.name === voice && playingVoice?.type === 'source' ? (
                      <StopIcon />
                    ) : (
                      <PlayIcon className="w-4 h-4" />
                    )}
                    Source
                  </button>
                  <button
                    onClick={() => playPreview(voice, 'sample')}
                    disabled={!currentVoiceInfo?.hasSample}
                    className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 text-sm ${
                      currentVoiceInfo?.hasSample
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                    title={
                      !currentVoiceInfo?.hasSample
                        ? 'No sample available'
                        : playingVoice?.name === voice && playingVoice?.type === 'sample'
                          ? 'Stop'
                          : 'Listen to TTS sample'
                    }
                  >
                    {playingVoice?.name === voice && playingVoice?.type === 'sample' ? (
                      <StopIcon />
                    ) : (
                      <PlayIcon className="w-4 h-4" />
                    )}
                    Sample
                  </button>
                </div>
              </div>
              {previewError && (
                <p className="text-sm text-amber-600 dark:text-amber-400">{previewError}</p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Voice changes apply to new audio generation. Cached audio will use the original
                settings.
              </p>
            </div>
          )}
        </div>

        <VoiceTagCard voices={voices} />
        <VoiceUploadCard voices={voices} onVoicesChanged={refetch} />
        <PronunciationEditor />
        <ProgressDisplayCard />
        <ChunkingModeCard />
      </main>
    </div>
  )
}
