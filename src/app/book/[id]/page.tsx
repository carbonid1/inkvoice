'use client'

import { useEffect, useState, useCallback } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Reader } from '@/components/Reader'
import { Player } from '@/components/Player'
import { DebugPanel, DebugMetrics } from '@/components/DebugPanel'
import { ParsedBook } from '@/lib/epub'
import { useStore } from '@/store/useStore'

export default function BookReader() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.id as string

  const [book, setBook] = useState<ParsedBook | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { getProgress, setProgress, setCurrentBook } = useStore()
  const savedProgress = getProgress(bookId)
  const [currentChapter, setCurrentChapter] = useState(savedProgress.chapter)
  const [currentSentence, setCurrentSentence] = useState(savedProgress.sentence)
  const [showDebug, setShowDebug] = useState(false)
  const [debugMetrics, setDebugMetrics] = useState<DebugMetrics>({
    lastGenTimeMs: null,
    lastCacheStatus: null,
    queueDepth: 0,
    prefetchedCount: 0,
  })

  useEffect(() => {
    async function fetchBook() {
      try {
        const response = await fetch(`/api/book/${bookId}`)
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Book not found')
          }
          throw new Error('Failed to load book')
        }
        const data: ParsedBook = await response.json()
        setBook(data)
        setCurrentBook(bookId)

        // Restore progress
        const progress = getProgress(bookId)
        if (progress.chapter < data.chapters.length) {
          setCurrentChapter(progress.chapter)
          const chapter = data.chapters[progress.chapter]
          if (chapter && progress.sentence < chapter.sentences.length) {
            setCurrentSentence(progress.sentence)
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchBook()
  }, [bookId, getProgress, setCurrentBook])

  const handleProgressChange = useCallback(
    (chapter: number, sentence: number) => {
      setCurrentChapter(chapter)
      setCurrentSentence(sentence)
      setProgress(bookId, chapter, sentence)
    },
    [bookId, setProgress]
  )

  const handleSentenceClick = useCallback(
    (chapter: number, sentence: number) => {
      handleProgressChange(chapter, sentence)
    },
    [handleProgressChange]
  )

  // Toggle debug panel with 'D' key
  useHotkeys('d', () => setShowDebug((prev) => !prev))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading book...</div>
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-red-600 dark:text-red-400">{error || 'Book not found'}</div>
        <Link
          href="/"
          className="text-blue-500 hover:text-blue-600 underline"
        >
          Return to library
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            title="Back to library"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold truncate">{book.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {book.author}
            </p>
          </div>
        </div>

        {book.chapters.length > 1 && (
          <div className="max-w-3xl mx-auto px-4 pb-2">
            <select
              value={currentChapter}
              onChange={(e) => handleProgressChange(Number(e.target.value), 0)}
              className="text-sm bg-gray-100 dark:bg-gray-800 border-none rounded px-2 py-1 w-full max-w-xs"
            >
              {book.chapters.map((chapter, idx) => (
                <option key={idx} value={idx}>
                  {chapter.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      <main className="max-w-3xl mx-auto">
        <Reader
          chapters={book.chapters}
          currentChapter={currentChapter}
          currentSentence={currentSentence}
          onSentenceClick={handleSentenceClick}
        />
      </main>

      <Player
        bookId={bookId}
        chapters={book.chapters}
        currentChapter={currentChapter}
        currentSentence={currentSentence}
        onProgressChange={handleProgressChange}
        onDebugUpdate={setDebugMetrics}
      />

      <DebugPanel metrics={debugMetrics} visible={showDebug} />
    </div>
  )
}
