'use client'

import { SpinnerIcon } from '@/components/icons/SpinnerIcon'
import { useUploadVoice } from '@/lib/hooks/useUploadVoice/useUploadVoice'
import { useRef, useState } from 'react'

const ACCEPTED_FORMATS =
  'audio/wav,audio/mpeg,audio/mp4,audio/ogg,audio/flac,.wav,.mp3,.m4a,.ogg,.flac'

type VoiceUploadSectionProps = {
  onVoicesChanged: () => void
}

export const VoiceUploadSection = ({ onVoicesChanged }: VoiceUploadSectionProps) => {
  const { uploading, error, upload, reset } = useUploadVoice()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleUpload()
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer"
      >
        {open ? '- Hide Upload' : '+ Add Voice'}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
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
              className="px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {uploading && <SpinnerIcon className="w-3.5 h-3.5 animate-spin" />}
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload a WAV, MP3, M4A, OGG, or FLAC file (at least 5 seconds). A TTS sample will be
            generated automatically.
          </p>
        </div>
      )}
    </div>
  )
}
