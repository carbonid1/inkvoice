'use client'

import { PageHeader } from '@/components/PageHeader/PageHeader'
import { getModKey } from '@/lib/helpers/getModKey/getModKey'
import { useDeleteBook } from '@/lib/hooks/useDeleteBook/useDeleteBook'
import { useUploadBook } from '@/lib/hooks/useUploadBook/useUploadBook'
import type { Book } from '@/lib/types/book'
import { useLibraryStore } from '@/store/useLibraryStore'
import type { Progress } from '@/store/useProgressStore'
import { useProgressStore } from '@/store/useProgressStore'
import { useVoiceStore } from '@/store/useVoiceStore'
import { Settings, Upload } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { toast } from 'sonner'
import { AddBookCard } from './components/AddBookCard/AddBookCard'
import { BookCard } from './components/BookCard/BookCard'

type UndoState = {
  book: Book
  previousProgress: Progress | undefined
  previousBookVoice: string | undefined
}

export default function Library() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hiddenBooks, setHiddenBooks] = useState<Set<string>>(new Set())
  const hiddenBooksRef = useRef(hiddenBooks)
  hiddenBooksRef.current = hiddenBooks
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)
  const lastDeletedRef = useRef<UndoState | null>(null)

  const books = useLibraryStore(s => s.books)
  const setBooks = useLibraryStore(s => s.setBooks)
  const addBooks = useLibraryStore(s => s.addBooks)
  const progress = useProgressStore(s => s.progress)
  const removeProgress = useProgressStore(s => s.removeProgress)
  const setProgress = useProgressStore(s => s.setProgress)
  const clearBookVoice = useVoiceStore(s => s.clearBookVoice)
  const setBookVoice = useVoiceStore(s => s.setBookVoice)

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
    fetchBooks()
  }, [fetchBooks])

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

    // Restore snapshotted progress and voice assignment
    if (undoState.previousProgress) {
      const p = undoState.previousProgress
      setProgress(undoState.book.id, p.chapter, p.sentence)
    }
    if (undoState.previousBookVoice) {
      setBookVoice(undoState.book.id, undoState.previousBookVoice)
    }

    fetchBooks()
  }, [unhideBook, restoreBook, setProgress, setBookVoice, fetchBooks])

  useHotkeys('mod+z', handleUndo)

  const handleRemove = useCallback(
    (book: Book) => {
      if (hiddenBooksRef.current.has(book.id)) return

      setHiddenBooks(prev => new Set(prev).add(book.id))

      // Snapshot state before destroying it
      const previousProgress = useProgressStore.getState().progress[book.id]
      const previousBookVoice = useVoiceStore.getState().bookVoices[book.id]

      lastDeletedRef.current = { book, previousProgress, previousBookVoice }

      removeProgress(book.id)
      clearBookVoice(book.id)

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

      deleteBook(book.id).then(deleted => {
        if (!deleted) {
          unhideBook(book.id)
          lastDeletedRef.current = null
          toast.error('Failed to delete book')
        }
      })
    },
    [removeProgress, clearBookVoice, deleteBook, handleUndo, unhideBook],
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
        <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">InkVoice</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Read and listen to your books</p>
          </div>
          <Link
            href="/settings"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Settings"
          >
            <Settings />
          </Link>
        </div>
      </PageHeader>

      <main className="max-w-6xl mx-auto px-8 py-8">
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className="flex flex-col p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              >
                <div className="w-full aspect-[2/3] bg-gray-200 dark:bg-gray-600 animate-pulse rounded mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-600 animate-pulse rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-600 animate-pulse rounded w-1/2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-600 animate-pulse rounded w-2/5 mt-1" />
              </div>
            ))}
          </div>
        )}

        {error && <div className="text-center py-12 text-red-600 dark:text-red-400">{error}</div>}

        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sortedBooks.map(book => (
              <BookCard key={book.id} book={book} onRemove={() => handleRemove(book)} />
            ))}
            <AddBookCard onUpload={handleUpload} uploading={uploading} />
          </div>
        )}
      </main>

      {isDragging && (
        <div className="fixed inset-0 z-50 bg-blue-500/10 border-2 border-dashed border-blue-400 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3 text-blue-500 dark:text-blue-400">
            <Upload className="w-16 h-16" />
            <span className="text-lg font-medium">Drop .epub files here</span>
          </div>
        </div>
      )}
    </div>
  )
}
