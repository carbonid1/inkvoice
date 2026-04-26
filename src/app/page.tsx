'use client'

import { buttonVariants, getModKey, toast, Tooltip } from '@carbonid1/design-system'
import { Settings, Upload } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { useDeleteBook } from '@/lib/hooks/useDeleteBook/useDeleteBook'
import { useUploadBook } from '@/lib/hooks/useUploadBook/useUploadBook'
import type { Book } from '@/lib/types/book'
import { useLibraryStore } from '@/store/useLibraryStore'
import { type Estimate, usePregenStore } from '@/store/usePregenStore'
import { useProgressStore } from '@/store/useProgressStore'
import { useVoiceStore } from '@/store/useVoiceStore'
import { AddBookCard } from './components/AddBookCard/AddBookCard'
import { BookCard } from './components/BookCard/BookCard'

interface UndoState {
  book: Book
}

export default function Library() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hiddenBooks, setHiddenBooks] = useState<Set<string>>(new Set())
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)
  const lastDeletedRef = useRef<UndoState | null>(null)

  const books = useLibraryStore(s => s.books)
  const setBooks = useLibraryStore(s => s.setBooks)
  const addBooks = useLibraryStore(s => s.addBooks)
  const progress = useProgressStore(s => s.progress)
  const progressLoaded = useProgressStore(s => s.loaded)
  const loadAllProgress = useProgressStore(s => s.loadAllProgress)
  const loadAllVoices = useVoiceStore(s => s.loadAll)
  const pregenLoaded = usePregenStore(s => s.loaded)
  const setEstimates = usePregenStore(s => s.setEstimates)

  const { uploading, error: uploadError, upload, reset: resetUpload } = useUploadBook()
  const { deleteBook, restoreBook } = useDeleteBook()

  const fetchBooks = useCallback(async () => {
    try {
      const response = await fetch('/api/books')

      if (!response.ok) throw new Error('Failed to fetch books')
      const data: Book[] = await response.json()

      setBooks(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [setBooks])

  useEffect(() => {
    let cancelled = false
    const loadBooks = async () => {
      try {
        const response = await fetch('/api/books')

        if (!response.ok) throw new Error('Failed to fetch books')
        const data: Book[] = await response.json()

        if (!cancelled) setBooks(data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadBooks()
    loadAllProgress()
    loadAllVoices()
    return () => {
      cancelled = true
    }
  }, [setBooks, loadAllProgress, loadAllVoices])

  // Fetch estimates for all books once library is loaded
  useEffect(() => {
    if (books.length === 0) return

    let cancelled = false
    const fetchEstimates = async () => {
      const results = await Promise.all(
        books.map(async book => {
          const response = await fetch(`/api/pregenerate/estimate/${book.id}`)

          if (!response.ok) return null
          const data = await response.json()

          return {
            bookId: book.id,
            estimate: {
              totalParagraphs: data.totalParagraphs,
              cachedParagraphs: data.cachedParagraphs,
              estimatedSizeBytes: data.estimatedSizeBytes,
              estimatedGenerationMinutes: data.estimatedGenerationMinutes,
              budget: data.budget,
            },
          }
        }),
      )

      if (cancelled) return
      const map: Record<string, Estimate> = {}

      for (const result of results) {
        if (result) map[result.bookId] = result.estimate
      }
      setEstimates(map)
    }

    fetchEstimates().catch(() => {})
    return () => {
      cancelled = true
    }
  }, [books, setEstimates])

  useEffect(() => {
    if (uploadError) {
      toast.error(uploadError)
      resetUpload()
    }
  }, [uploadError, resetUpload])

  const handleUpload = useCallback(
    async (files: FileList) => {
      const fileArray = Array.from(files).filter(f => f.name.endsWith('.epub'))

      if (fileArray.length === 0) return

      const uploaded = await upload(fileArray)

      if (uploaded.length > 0) {
        addBooks(uploaded)
        setHiddenBooks(prev => {
          const next = new Set(prev)

          uploaded.forEach(b => next.delete(b.id))
          return next
        })
      }
    },
    [upload, addBooks],
  )

  const unhideBook = useCallback((bookId: string) => {
    setHiddenBooks(prev => {
      const next = new Set(prev)

      next.delete(bookId)
      return next
    })
  }, [])

  const handleUndo = useCallback(async () => {
    const undoState = lastDeletedRef.current

    if (!undoState) return
    lastDeletedRef.current = null

    unhideBook(undoState.book.id)
    toast.dismiss()

    const restored = await restoreBook(undoState.book.id)

    if (!restored) {
      toast.error('Failed to restore book')
      return
    }

    fetchBooks()
  }, [unhideBook, restoreBook, fetchBooks])

  useHotkeys('mod+z', handleUndo)

  const handleRemove = useCallback(
    (bookId: string) => {
      const book = books.find(b => b.id === bookId)

      if (!book || hiddenBooks.has(bookId)) return

      setHiddenBooks(prev => new Set(prev).add(bookId))

      lastDeletedRef.current = { book }

      toast.dismiss()
      toast('Book removed', {
        description: `${getModKey()}+Z to undo`,
        action: {
          label: 'Undo',
          onClick: () => {
            handleUndo()
          },
        },
        duration: 5000,
      })

      deleteBook(bookId).then(deleted => {
        if (!deleted) {
          unhideBook(bookId)
          lastDeletedRef.current = null
          toast.error('Failed to delete book')
        }
      })
    },
    [books, hiddenBooks, deleteBook, handleUndo, unhideBook],
  )

  // Drag-and-drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current += 1
    if (dragCounterRef.current === 1) {
      setIsDragging(true)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current -= 1
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      dragCounterRef.current = 0
      setIsDragging(false)

      const files = e.dataTransfer.files

      if (files.length > 0) {
        handleUpload(files)
      }
    },
    [handleUpload],
  )

  const sortedBooks = useMemo(() => {
    const visible = books.filter(b => !hiddenBooks.has(b.id))

    return [...visible].sort((a, b) => {
      const aRead = progress[a.id]?.lastReadAt ?? 0
      const bRead = progress[b.id]?.lastReadAt ?? 0

      return bRead - aRead
    })
  }, [books, hiddenBooks, progress])

  return (
    <div
      className="min-h-screen"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <PageHeader>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
          <h1 className="font-semibold">Library</h1>
          <Tooltip label="Settings" position="bottom">
            <Link
              href="/settings"
              className={buttonVariants({ size: 'icon' })}
              aria-label="Settings"
            >
              <Settings />
            </Link>
          </Tooltip>
        </div>
      </PageHeader>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {(loading || !progressLoaded || !pregenLoaded) && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className="border-border bg-background flex flex-col rounded-lg border p-4"
              >
                <div className="bg-muted mb-3 aspect-2/3 w-full animate-pulse rounded-sm" />
                <div className="bg-muted mb-2 h-4 w-3/4 animate-pulse rounded-sm" />
                <div className="bg-muted h-3 w-1/2 animate-pulse rounded-sm" />
                <div className="bg-muted mt-1 h-3 w-2/5 animate-pulse rounded-sm" />
              </div>
            ))}
          </div>
        )}

        {error && <div className="text-destructive py-12 text-center">{error}</div>}

        {!loading && progressLoaded && pregenLoaded && !error && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {sortedBooks.map(book => (
              <BookCard key={book.id} book={book} onRemove={handleRemove} />
            ))}
            <AddBookCard onUpload={handleUpload} uploading={uploading} />
          </div>
        )}
      </main>

      {isDragging && (
        <div className="border-primary-border bg-primary-muted pointer-events-none fixed inset-0 z-50 flex items-center justify-center border-2 border-dashed">
          <div className="text-primary flex flex-col items-center gap-3">
            <Upload className="size-16" />
            <span className="text-lg font-medium">Drop .epub files here</span>
          </div>
        </div>
      )}
    </div>
  )
}
