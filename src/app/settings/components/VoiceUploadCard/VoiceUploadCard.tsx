'use client'

import { CloseIcon } from '@/components/icons/CloseIcon'
import { PlayIcon } from '@/components/icons/PlayIcon'
import { SpinnerIcon } from '@/components/icons/SpinnerIcon'
import { StopIcon } from '@/components/icons/StopIcon'
import { useDeleteVoice } from '@/lib/hooks/useDeleteVoice/useDeleteVoice'
import { useUploadVoice } from '@/lib/hooks/useUploadVoice/useUploadVoice'
import type { VoiceEntry } from '@/lib/services/voice/voice.types'
import { useVoiceStore } from '@/store/useVoiceStore'
import { useEffect, useRef, useState } from 'react'

type VoiceUploadCardProps = {
  voices: VoiceEntry[]
  onVoicesChanged: () => void
}

const ACCEPTED_FORMATS =
  'audio/wav,audio/mpeg,audio/mp4,audio/ogg,audio/flac,.wav,.mp3,.m4a,.ogg,.flac'

export const VoiceUploadCard = ({ voices, onVoicesChanged }: VoiceUploadCardProps) => {
  const customVoices = voices.filter(v => v.type === 'custom')
  const { uploading, error, upload, reset } = useUploadVoice()
  const { deleting, deleteVoice } = useDeleteVoice()
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const clearVoiceFromAllBooks = useVoiceStore(s => s.clearVoiceFromAllBooks)

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const handleUpload = async () => {
    if (!file || !name.trim()) return

    const result = await upload(file, name.trim())
    if (result) {
      setName('')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      onVoicesChanged()
    }
  }

  const handleDelete = async (voiceName: string) => {
    const deleted = await deleteVoice(voiceName)
    if (!deleted) return

    clearVoiceFromAllBooks(voiceName)
    onVoicesChanged()
  }

  const playSource = async (voiceName: string) => {
    if (playingVoice === voiceName) {
      audioRef.current?.pause()
      audioRef.current = null
      setPlayingVoice(null)
      return
    }

    audioRef.current?.pause()

    try {
      const response = await fetch(`/api/voices/${voiceName}/source?v=3`)
      if (!response.ok) return

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      setPlayingVoice(voiceName)

      audio.onended = () => {
        setPlayingVoice(null)
        URL.revokeObjectURL(url)
      }

      audio.onerror = () => {
        setPlayingVoice(null)
        URL.revokeObjectURL(url)
      }

      await audio.play()
    } catch {
      setPlayingVoice(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleUpload()
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold mb-4">Custom Voices</h2>

      <div className="space-y-4">
        {customVoices.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No custom voices yet</p>
        ) : (
          <div className="space-y-2">
            {customVoices.map(v => (
              <div key={v.name} className="flex items-center gap-3 text-sm">
                <span className="flex-1 font-medium">{v.displayName}</span>
                <span className="text-xs text-gray-400">{v.name}</span>
                <button
                  onClick={() => playSource(v.name)}
                  className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                  title={playingVoice === v.name ? 'Stop' : 'Play source'}
                >
                  {playingVoice === v.name ? (
                    <StopIcon className="w-3.5 h-3.5" />
                  ) : (
                    <PlayIcon className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(v.name)}
                  disabled={deleting}
                  className="p-1 text-gray-400 hover:text-red-500 disabled:text-gray-300 dark:disabled:text-gray-600 transition-colors"
                  title={`Remove "${v.displayName}"`}
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value)
                reset()
              }}
              onKeyDown={handleKeyDown}
              placeholder="Voice name"
              className="flex-1 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FORMATS}
              onChange={e => {
                setFile(e.target.files?.[0] ?? null)
                reset()
              }}
              className="flex-1 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-600 dark:file:bg-blue-900/20 dark:file:text-blue-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpload}
              disabled={!name.trim() || !file || uploading}
              className="px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-1.5"
            >
              {uploading && <SpinnerIcon className="w-3.5 h-3.5 animate-spin" />}
              {uploading ? 'Uploading...' : 'Add Voice'}
            </button>
            {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
          </div>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Upload a WAV, MP3, M4A, OGG, or FLAC file (at least 5 seconds). A TTS sample will be
          generated automatically.
        </p>
      </div>
    </div>
  )
}
