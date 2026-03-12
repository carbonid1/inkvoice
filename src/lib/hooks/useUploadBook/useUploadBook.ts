'use client'

import type { Book } from '@/lib/types/book'
import { useCallback, useMemo, useState } from 'react'

type UploadBookState = {
  uploading: boolean
  error: string | null
  upload: (files: File[]) => Promise<Book[]>
  reset: () => void
}

export const useUploadBook = (): UploadBookState => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(async (files: File[]): Promise<Book[]> => {
    setUploading(true)
    setError(null)

    const results: Book[] = []

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/books', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error ?? 'Upload failed')
          break
        }

        results.push(data as Book)
      }
    } catch {
      setError('Failed to upload book')
    } finally {
      setUploading(false)
    }

    return results
  }, [])

  const reset = useCallback(() => {
    setError(null)
  }, [])

  return useMemo(() => ({ uploading, error, upload, reset }), [uploading, error, upload, reset])
}
