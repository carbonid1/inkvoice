'use client'

import { useCallback, useMemo, useState } from 'react'

type UploadResult = {
  name: string
  displayName: string
  durationSeconds: number
  transcription: string | null
}

type UploadState = {
  uploading: boolean
  error: string | null
  upload: (file: File, displayName: string, language?: string) => Promise<UploadResult | null>
  reset: () => void
}

export const useUploadVoice = (): UploadState => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(
    async (file: File, displayName: string, language?: string): Promise<UploadResult | null> => {
      setUploading(true)
      setError(null)

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('name', displayName)
        if (language) formData.append('language', language)

        const response = await fetch('/api/voices', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error ?? 'Upload failed')
          return null
        }

        return {
          name: data.name,
          displayName: data.displayName,
          durationSeconds: data.durationSeconds,
          transcription: data.transcription ?? null,
        }
      } catch {
        setError('Failed to upload voice')
        return null
      } finally {
        setUploading(false)
      }
    },
    [],
  )

  const reset = useCallback(() => {
    setError(null)
  }, [])

  return useMemo(() => ({ uploading, error, upload, reset }), [uploading, error, upload, reset])
}
