'use client'

import { DebugMetrics, DebugPanel } from '@/components/DebugPanel'
import { Reader } from '@/components/Reader'
import { ChevronLeftIcon } from '@/components/icons/ChevronLeftIcon'
import { PlayerContainer } from '@/components/player/PlayerContainer'
import { computeProgressPercent } from '@/lib/helpers/computeProgressPercent/computeProgressPercent'
import type { BookOverview, ParsedChapter } from '@/lib/types/book'
import { useHydrated, useStore } from '@/store/useStore'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

export default function BookReader() {
  const params = useParams()
  const bookId = params.id as string

  const [overview, setOverview] = useState<BookOverview | null>(null)
  const [chapterData, setChapterData] = useState<ParsedChapter | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    currentSentence: 0,
    totalSentences: 0,
    currentChapter: 0,
    totalChapters: 0,
  })

  // Fetch book overview on mount (after hydration)
  useEffect(() => {
    if (!hydrated) return

    const fetchOverview = async () => {
      try {
        const response = await fetch(`/api/book/${bookId}`)
        if (!response.ok) {
          if (response.status === 404) throw new Error('Book not found')
          throw new Error('Failed to load book')
        }
        const data: BookOverview = await response.json()
        setOverview(data)
        setCurrentBook(bookId)

        // Write book metadata for library progress bars
        const sentencesPerChapter = data.chapters.map(ch => ch.sentenceCount)
        setBookMetadata(bookId, data.chapters.length, sentencesPerChapter)

        // Restore progress
        const progress = getProgress(bookId)
        if (progress.chapter < data.chapters.length) {
          setCurrentChapter(progress.chapter)
          const chapterInfo = data.chapters[progress.chapter]
          if (chapterInfo && progress.sentence < chapterInfo.sentenceCount) {
            setCurrentSentence(progress.sentence)
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchOverview()
  }, [bookId, hydrated, getProgress, setCurrentBook, setBookMetadata])

  // Fetch chapter content when currentChapter changes
  useEffect(() => {
    if (!overview) return

    const fetchChapter = async () => {
      try {
        const response = await fetch(`/api/book/${bookId}/chapter/${currentChapter}`)
        if (!response.ok) throw new Error('Failed to load chapter')
        const data: ParsedChapter = await response.json()
        setChapterData(data)
      } catch (e) {
        console.error('Failed to fetch chapter:', e)
        setError(e instanceof Error ? e.message : 'Failed to load chapter')
      }
    }

    fetchChapter()
  }, [bookId, overview, currentChapter])

  const handleProgressChange = useCallback(
    (chapter: number, sentence: number) => {
      setCurrentChapter(chapter)
      setCurrentSentence(sentence)
      setProgress(bookId, chapter, sentence)
    },
    [bookId, setProgress],
  )

  const handleSentenceClick = useCallback(
    (chapter: number, sentence: number) => {
      handleProgressChange(chapter, sentence)
    },
    [handleProgressChange],
  )

  // Sync position into debug metrics
  useEffect(() => {
    if (!overview) return
    setDebugMetrics(prev => ({
      ...prev,
      currentSentence,
      totalSentences: overview.chapters[currentChapter]?.sentenceCount ?? 0,
      currentChapter,
      totalChapters: overview.chapters.length,
    }))
  }, [currentChapter, currentSentence, overview])

  // Toggle debug panel with 'D' key
  useHotkeys('d', () => setShowDebug(prev => !prev))

  const progressPercent = computeProgressPercent(getProgress(bookId)) ?? 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading book...</div>
      </div>
    )
  }

  if (error || !overview) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-red-600 dark:text-red-400">{error || 'Book not found'}</div>
        <Link href="/" className="text-blue-500 hover:text-blue-600 underline">
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
            <h1 className="font-semibold truncate">{overview.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{overview.author}</p>
          </div>
        </div>

        {overview.chapters.length > 1 && (
          <div className="max-w-3xl mx-auto px-4 pb-2">
            <select
              value={currentChapter}
              onChange={e => handleProgressChange(Number(e.target.value), 0)}
              className="text-sm bg-gray-100 dark:bg-gray-800 border-none rounded px-2 py-1 w-full max-w-xs"
            >
              {overview.chapters.map((chapter, idx) => (
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
        {chapterData ? (
          <Reader
            chapter={chapterData}
            currentChapter={currentChapter}
            currentSentence={currentSentence}
            onSentenceClick={handleSentenceClick}
          />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Loading chapter...
          </div>
        )}
      </main>

      <PlayerContainer
        bookId={bookId}
        chapters={overview.chapters}
        currentChapter={currentChapter}
        currentSentence={currentSentence}
        onProgressChange={handleProgressChange}
        onDebugUpdate={setDebugMetrics}
      />

      <DebugPanel metrics={debugMetrics} visible={showDebug} />
    </div>
  )
}
