'use client'

import { useUploadVoice } from '@/lib/hooks/useUploadVoice/useUploadVoice'
import { Loader2, Plus } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { getAudioDuration } from './helpers/getAudioDuration/getAudioDuration'
import { useSamplePolling } from './hooks/useSamplePolling/useSamplePolling'

const ACCEPTED_FORMATS =
  'audio/wav,audio/mpeg,audio/mp4,audio/ogg,audio/flac,.wav,.mp3,.m4a,.ogg,.flac'

const MIN_DURATION = 5
const MAX_DURATION = 30

type VoiceUploadSectionProps = {
  onVoicesChanged: () => void
}

export const VoiceUploadSection = ({ onVoicesChanged }: VoiceUploadSectionProps) => {
  const { uploading, error, upload, reset } = useUploadVoice()
  const { startPolling } = useSamplePolling({ onSampleReady: onVoicesChanged })
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileDuration, setFileDuration] = useState<number | null>(null)
  const [durationError, setDurationError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const isDurationInvalid =
    fileDuration !== null && (fileDuration < MIN_DURATION || fileDuration > MAX_DURATION)

  const handleFileChange = async (selectedFile: File | null) => {
    setFile(selectedFile)
    setFileDuration(null)
    setDurationError(null)
    reset()

    if (!selectedFile) return

    try {
      const duration = await getAudioDuration(selectedFile)
      setFileDuration(duration)
    } catch {
      setDurationError('Could not read audio file')
    }
  }

  const handleUpload = async () => {
    if (!file || !name.trim() || isDurationInvalid) return

    const result = await upload(file, name.trim())
    if (result) {
      setName('')
      setFile(null)
      setFileDuration(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      onVoicesChanged()
      startPolling(result.name)
      setOpen(false)
      toast('Voice added', { description: 'Open a book to start listening' })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleUpload()
    }
  }

  const displayError = error ?? durationError

  const durationText =
    fileDuration !== null
      ? isDurationInvalid
        ? `${fileDuration.toFixed(1)}s — must be ${MIN_DURATION}–${MAX_DURATION} seconds`
        : `${fileDuration.toFixed(1)}s`
      : null

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={`w-full rounded-lg border py-2.5 px-3 text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer ${
          open
            ? 'border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
            : 'border-border text-muted-foreground hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400'
        }`}
      >
        <Plus className="w-4 h-4" />
        {open ? 'Hide Upload' : 'Add Voice'}
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
              aria-label="Voice name"
              className="flex-1 p-2 text-sm border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FORMATS}
              onChange={e => handleFileChange(e.target.files?.[0] ?? null)}
              className="flex-1 p-2 text-sm border border-border rounded-lg bg-background text-foreground file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-600 dark:file:bg-blue-900/20 dark:file:text-blue-400"
            />
          </div>
          {durationText && (
            <p
              className={`text-sm ${isDurationInvalid ? 'text-red-500 dark:text-red-400' : 'text-muted-foreground'}`}
            >
              Duration: {durationText}
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpload}
              disabled={!name.trim() || !file || uploading || isDurationInvalid}
              className="px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            {displayError && (
              <p className="text-sm text-red-500 dark:text-red-400">{displayError}</p>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Upload a WAV, MP3, M4A, OGG, or FLAC file (5–30 seconds). A TTS sample will be generated
            automatically.
          </p>
        </div>
      )}
    </div>
  )
}
