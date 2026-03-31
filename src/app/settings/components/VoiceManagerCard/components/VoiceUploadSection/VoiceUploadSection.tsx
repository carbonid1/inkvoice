'use client'

import { Button } from '@/components/ui/Button/Button'
import { useUploadVoice } from '@/lib/hooks/useUploadVoice/useUploadVoice'
import { Plus } from 'lucide-react'
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
        className={`flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
          open
            ? 'border-blue-300 bg-blue-50/50 text-blue-600 dark:border-blue-700 dark:bg-blue-900/10 dark:text-blue-400'
            : 'border-border text-muted-foreground hover:border-blue-300 hover:text-blue-600 dark:hover:border-blue-700 dark:hover:text-blue-400'
        }`}
      >
        <Plus className="size-4" />
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
              className="border-border bg-background text-foreground flex-1 rounded-lg border p-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FORMATS}
              onChange={e => handleFileChange(e.target.files?.[0] ?? null)}
              className="border-border bg-background text-foreground flex-1 rounded-lg border p-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-blue-50 file:px-2 file:py-1 file:text-xs file:text-blue-600 dark:file:bg-blue-900/20 dark:file:text-blue-400"
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
            <Button
              variant="solid"
              size="small"
              onClick={handleUpload}
              disabled={!name.trim() || !file || isDurationInvalid}
              loading={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
            {displayError && (
              <p className="text-sm text-red-500 dark:text-red-400">{displayError}</p>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            Upload a WAV, MP3, M4A, OGG, or FLAC file (5–30 seconds). A TTS sample will be generated
            automatically.
          </p>
        </div>
      )}
    </div>
  )
}
