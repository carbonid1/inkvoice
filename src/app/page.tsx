'use client'

import { buttonVariants, getModKey, Kbd, toast, Tooltip } from '@carbonid1/design-system'
import { Settings, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { SearchInput } from '@/components/ui/SearchInput/SearchInput'
import { useDeleteBook } from '@/lib/hooks/useDeleteBook/useDeleteBook'
import { useLibrarySearch } from '@/lib/hooks/useLibrarySearch/useLibrarySearch'
import { useMounted } from '@/lib/hooks/useMounted/useMounted'
import { useUploadBook } from '@/lib/hooks/useUploadBook/useUploadBook'
import type { Book } from '@/lib/types/book'
import { useLibraryStore } from '@/store/useLibraryStore'
import { type Estimate, usePregenStore } from '@/store/usePregenStore'
import { useProgressStore } from '@/store/useProgressStore'
import { useVoiceStore } from '@/store/useVoiceStore'
import { AddBookCard } from './components/AddBookCard/AddBookCard'
import { BookGrid } from './components/BookGrid/BookGrid'

interface UndoState {
  book: Book
}

export default function Library() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hiddenBooks, setHiddenBooks] = useState<Set<string>>(new Set())
  const [isDragging, setIsDragging] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dragCounterRef = useRef(0)
  const lastDeletedRef = useRef<UndoState | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const mounted = useMounted()

  const books = useLibraryStore(s => s.books)
  const setBooks = useLibraryStore(s => s.setBooks)
  const addBooks = useLibraryStore(s => s.addBooks)
  const progress = useProgressStore(s => s.progress)
  const progressLoaded = useProgressStore(s => s.loaded)
  const loadAllProgress = useProgressStore(s => s.loadAllProgress)
  const loadAllVoices = useVoiceStore(s => s.loadAll)
  const pregenLoaded = usePregenStore(s => s.loaded)
  const setEstimates = usePregenStore(s => s.setEstimates)

  const { uploading, progress: uploadProgress, upload } = useUploadBook()
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
      const response = await fetch('/api/pregenerate/estimate')

      if (!response.ok || cancelled) return

      const data: Record<string, Estimate> = await response.json()

      if (!cancelled) setEstimates(data)
    }

    fetchEstimates().catch(() => {})
    return () => {
      cancelled = true
    }
  }, [books, setEstimates])

  const handleUpload = useCallback(
    async (files: FileList) => {
      const fileArray = Array.from(files).filter(f => f.name.endsWith('.epub'))

      if (fileArray.length === 0) return

      const { failures } = await upload(fileArray, book => {
        addBooks([book])
        setHiddenBooks(prev => {
          if (!prev.has(book.id)) return prev
          const next = new Set(prev)

          next.delete(book.id)
          return next
        })
      })

      failures.forEach(failure => {
        toast.error(failure.filename, {
          description: failure.error,
          duration: Infinity,
          closeButton: true,
        })
      })
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

  useHotkeys(
    'mod+f',
    () => {
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    },
    { preventDefault: true, enableOnFormTags: ['input'] },
  )

  const handleSearchKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Escape') return
      if (searchQuery) {
        e.preventDefault()
        setSearchQuery('')
      } else {
        e.currentTarget.blur()
      }
    },
    [searchQuery],
  )

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    searchInputRef.current?.focus()
  }, [])

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

  const visibleBooks = useLibrarySearch({ books: sortedBooks, query: searchQuery })
  const isSearching = searchQuery.trim() !== ''

  return (
    <div
      className="flex h-full flex-col"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <PageHeader>
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <h1 className="font-semibold">Library</h1>
          <SearchInput
            ref={searchInputRef}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search by title or author"
            aria-label="Search library"
            className="flex-1"
            trailing={
              searchQuery ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="text-muted-foreground hover:text-foreground -mr-1 rounded-sm p-0.5 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              ) : (
                mounted && <Kbd keys={['mod', 'F']} size="sm" className="hidden sm:inline-flex" />
              )
            }
          />
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

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-8">
          {(loading || !progressLoaded || !pregenLoaded) && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 10 }, (_, i) => (
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
            <>
              <div aria-live="polite" className="sr-only">
                {isSearching
                  ? `${visibleBooks.length} ${visibleBooks.length === 1 ? 'book' : 'books'} match ${searchQuery}`
                  : ''}
              </div>
              {isSearching && visibleBooks.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground text-sm">No books match “{searchQuery}”</p>
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="text-primary mt-2 text-xs hover:underline"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <BookGrid
                  books={visibleBooks}
                  onRemove={handleRemove}
                  firstCell={
                    isSearching ? undefined : (
                      <AddBookCard
                        onUpload={handleUpload}
                        uploading={uploading}
                        progress={uploadProgress}
                      />
                    )
                  }
                />
              )}
            </>
          )}
        </div>
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
