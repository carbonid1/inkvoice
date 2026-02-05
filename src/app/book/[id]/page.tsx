'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Reader } from '@/components/Reader'
import { PlayerContainer } from '@/components/player/PlayerContainer'
import { DebugPanel, DebugMetrics } from '@/components/DebugPanel'
import type { ParsedBook } from '@/lib/types/book'
import { useStore, useHydrated } from '@/store/useStore'
import { computeProgressPercent } from '@/lib/helpers/computeProgressPercent/computeProgressPercent'
import { ChevronLeftIcon } from '@/components/icons/ChevronLeftIcon'
import { MoreVerticalIcon } from '@/components/icons/MoreVerticalIcon'

export default function BookReader() {
  const params = useParams()
  const bookId = params.id as string

  const [book, setBook] = useState<ParsedBook | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const { getProgress, setProgress, setCurrentBook, setBookMetadata } = useStore()
  const hydrated = useHydrated()
  const savedProgress = getProgress(bookId)
  const [currentChapter, setCurrentChapter] = useState(savedProgress.chapter)
  const [currentSentence, setCurrentSentence] = useState(savedProgress.sentence)
  const [showDebug, setShowDebug] = useState(false)
  const [debugMetrics, setDebugMetrics] = useState<DebugMetrics>({
    isGenerating: false,
    ahead: 0,
    cacheUsedMB: 0,
    cacheMaxMB: 800,
  })

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [menuOpen])

  // Guard fetchBook on hydration to avoid reading stale {0,0}
  useEffect(() => {
    if (!hydrated) return

    const fetchBook = async () => {
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

        // Write book metadata for library progress bars
        const sentencesPerChapter = data.chapters.map((ch) => ch.sentences.length)
        setBookMetadata(bookId, data.chapters.length, sentencesPerChapter)

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
  }, [bookId, hydrated, getProgress, setCurrentBook, setBookMetadata])

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

  const handleStartFromBeginning = useCallback(() => {
    handleProgressChange(0, 0)
    setMenuOpen(false)
  }, [handleProgressChange])

  // Toggle debug panel with 'D' key
  useHotkeys('d', () => setShowDebug((prev) => !prev))

  const progressPercent = computeProgressPercent(getProgress(bookId)) ?? 0

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
            <ChevronLeftIcon />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold truncate">{book.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {book.author}
            </p>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title="More options"
            >
              <MoreVerticalIcon />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[180px] z-20">
                <button
                  onClick={handleStartFromBeginning}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Start from beginning
                </button>
              </div>
            )}
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

        {/* Book-level progress bar */}
        <div className="h-0.5 bg-gray-100 dark:bg-gray-800">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      <main className="max-w-3xl mx-auto">
        <Reader
          chapters={book.chapters}
          currentChapter={currentChapter}
          currentSentence={currentSentence}
          onSentenceClick={handleSentenceClick}
        />
      </main>

      <PlayerContainer
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
