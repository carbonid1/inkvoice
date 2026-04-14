'use client'

import { useUploadVoice } from '@/lib/hooks/useUploadVoice/useUploadVoice'
import { Button, Select } from '@carbonid1/design-system'
import { Plus } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { TranscriptionReview } from './components/TranscriptionReview/TranscriptionReview'
import { getAudioDuration } from './helpers/getAudioDuration/getAudioDuration'
import { useSamplePolling } from './hooks/useSamplePolling/useSamplePolling'

const ACCEPTED_FORMATS =
  'audio/wav,audio/mpeg,audio/mp4,audio/ogg,audio/flac,.wav,.mp3,.m4a,.ogg,.flac'

const MIN_DURATION = 10
const MAX_DURATION = 20

const LANGUAGE_OPTIONS = [
  { value: '', label: 'Auto-detect' },
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Russian' },
  { value: 'uk', label: 'Ukrainian' },
]

type UploadFormValues = {
  name: string
}

type UploadedVoice = {
  name: string
  transcription: string
}

type VoiceUploadSectionProps = {
  onVoicesChanged: () => void
}

export const VoiceUploadSection = ({ onVoicesChanged }: VoiceUploadSectionProps) => {
  const { uploading, error: uploadError, upload, reset: resetUpload } = useUploadVoice()
  const { startPolling } = useSamplePolling({ onSampleReady: onVoicesChanged })
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    reset: resetForm,
    formState: { errors },
  } = useForm<UploadFormValues>({ mode: 'onSubmit' })
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [language, setLanguage] = useState('')
  const [fileDuration, setFileDuration] = useState<number | null>(null)
  const [uploadedVoice, setUploadedVoice] = useState<UploadedVoice | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = async (selectedFile: File | null) => {
    setFile(selectedFile)
    setFileDuration(null)
    clearErrors('root')
    resetUpload()

    if (!selectedFile) return

    try {
      const duration = await getAudioDuration(selectedFile)
      setFileDuration(duration)
    } catch {
      setError('root', { message: 'Could not read audio file' })
    }
  }

  const onSubmit = handleSubmit(async data => {
    if (!file) {
      setError('root', { message: 'Audio file is required' })
      return
    }
    if (fileDuration === null) {
      setError('root', { message: 'Could not read audio duration' })
      return
    }
    if (fileDuration < MIN_DURATION || fileDuration > MAX_DURATION) {
      setError('root', {
        message: `Audio must be ${MIN_DURATION}–${MAX_DURATION} seconds (got ${fileDuration.toFixed(1)}s)`,
      })
      return
    }

    const result = await upload(file, data.name.trim(), language || undefined)
    if (result) {
      setUploadedVoice({ name: result.name, transcription: result.transcription ?? '' })
      onVoicesChanged()
      startPolling(result.name)
    }
  })

  const handleDone = () => {
    resetForm()
    setFile(null)
    setFileDuration(null)
    setLanguage('')
    setUploadedVoice(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setOpen(false)
    onVoicesChanged()
    toast('Voice added', { description: 'Open a book to start listening' })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  const errorMessage = errors.name?.message ?? uploadError ?? errors.root?.message ?? null

  const durationText = fileDuration !== null ? `${fileDuration.toFixed(1)}s` : null

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-4 text-sm ring-1 transition-colors ${
          open
            ? 'ring-primary-border bg-primary-muted text-primary'
            : 'ring-border text-muted-foreground hover:ring-primary-border hover:text-primary'
        }`}
      >
        <Plus className="size-4" />
        {open ? 'Hide Upload' : 'Add Voice'}
      </button>

      {open && !uploadedVoice && (
        <div className="mt-3 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              {...register('name', { required: 'Voice name is required' })}
              onKeyDown={handleKeyDown}
              placeholder="Voice name"
              aria-label="Voice name"
              className="border-border bg-background text-foreground focus:ring-primary flex-1 rounded-lg border p-2 text-sm focus:border-transparent focus:ring-2"
            />
            <div className="w-36">
              <Select
                value={language}
                onChange={setLanguage}
                options={LANGUAGE_OPTIONS}
                aria-label="Voice language"
                className="h-full"
              />
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FORMATS}
            onChange={e => handleFileChange(e.target.files?.[0] ?? null)}
            className="border-border bg-background text-foreground file:bg-primary-muted file:text-primary w-full rounded-lg border p-2 text-sm file:mr-2 file:rounded file:border-0 file:px-2 file:py-1 file:text-xs"
          />
          {durationText && (
            <p className="text-muted-foreground text-sm">Duration: {durationText}</p>
          )}
          <div className="flex items-center gap-2">
            <Button variant="primary" size="small" onClick={onSubmit} loading={uploading}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
            {errorMessage && <p className="text-destructive text-sm">{errorMessage}</p>}
          </div>
          <p className="text-muted-foreground text-sm">
            Upload a WAV, MP3, M4A, OGG, or FLAC file (10–20 seconds). A TTS sample will be
            generated automatically.
          </p>
        </div>
      )}

      {open && uploadedVoice && (
        <TranscriptionReview
          voiceName={uploadedVoice.name}
          language={language}
          initialTranscription={uploadedVoice.transcription}
          onDone={handleDone}
        />
      )}
    </div>
  )
}
