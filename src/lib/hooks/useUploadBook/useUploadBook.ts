'use client'

import { useCallback, useMemo, useState } from 'react'
import { type Book, bookSchema } from '@/lib/types/book'

export interface UploadFailure {
  filename: string
  error: string
  code?: string
}

export interface UploadResult {
  successes: Book[]
  failures: UploadFailure[]
}

export interface UploadProgress {
  current: number
  total: number
}

interface UploadBookState {
  uploading: boolean
  progress: UploadProgress | null
  upload: (files: File[], onBookUploaded?: (book: Book) => void) => Promise<UploadResult>
}

export const useUploadBook = (): UploadBookState => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgress | null>(null)

  const upload = useCallback(
    async (files: File[], onBookUploaded?: (book: Book) => void): Promise<UploadResult> => {
      setUploading(true)
      setProgress({ current: 0, total: files.length })

      const successes: Book[] = []
      const failures: UploadFailure[] = []

      for (const [index, file] of files.entries()) {
        setProgress({ current: index + 1, total: files.length })

        try {
          const formData = new FormData()

          formData.append('file', file)

          const response = await fetch('/api/books', { method: 'POST', body: formData })
          const data = await response.json().catch(() => null)

          if (!response.ok) {
            failures.push({
              filename: file.name,
              error: data?.error ?? `Upload failed (${response.status})`,
              code: data?.code,
            })
            continue
          }

          const parsed = bookSchema.safeParse(data)

          if (!parsed.success) {
            failures.push({ filename: file.name, error: 'Invalid server response' })
            continue
          }

          successes.push(parsed.data)
          onBookUploaded?.(parsed.data)
        } catch {
          failures.push({ filename: file.name, error: 'Network error' })
        }
      }

      setUploading(false)
      setProgress(null)

      return { successes, failures }
    },
    [],
  )

  return useMemo(() => ({ uploading, progress, upload }), [uploading, progress, upload])
}
