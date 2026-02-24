'use client'

import { DebugMetrics, DebugPanel } from '@/components/DebugPanel'
import { Reader } from '@/components/Reader/Reader'
import { ChevronLeftIcon } from '@/components/icons/ChevronLeftIcon'
import { SpinnerIcon } from '@/components/icons/SpinnerIcon'
import { PlayerContainer } from '@/components/player/PlayerContainer'
import { useDebouncedLoading } from '@/lib/hooks/useDebouncedLoading/useDebouncedLoading'
import type { ParsedChapter } from '@/lib/types/book'
import { useDisplayStore } from '@/store/useDisplayStore'
import { useProgressStore } from '@/store/useProgressStore'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { ProgressIndicator } from './components/ProgressIndicator/ProgressIndicator'
import { useBookOverview } from './hooks/useBookOverview/useBookOverview'

export default function BookReader() {
  const params = useParams()
  const bookId = params.id as string

  const chunkingMode = useDisplayStore(s => s.chunkingMode)
  const { overview, loading, error, initialChapter, initialSentence } = useBookOverview(
    bookId,
    chunkingMode,
  )

  const [chapterData, setChapterData] = useState<ParsedChapter | null>(null)
  const [currentChapter, setCurrentChapter] = useState(initialChapter)
  const [currentSentence, setCurrentSentence] = useState(initialSentence)
  const [chapterLoading, setChapterLoading] = useState(false)
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

  const setProgress = useProgressStore(s => s.setProgress)
  const getProgress = useProgressStore(s => s.getProgress)

  // Sync position when hook resolves initial values from overview
  useEffect(() => {
    setCurrentChapter(initialChapter)
    setCurrentSentence(initialSentence)
  }, [initialChapter, initialSentence])

  // Reset sentence position when chunking mode changes
  const prevModeRef = useRef(chunkingMode)
  useEffect(() => {
    if (prevModeRef.current !== chunkingMode) {
      prevModeRef.current = chunkingMode
      setCurrentSentence(0)
      setProgress(bookId, currentChapter, 0)
    }
  }, [chunkingMode, bookId, currentChapter, setProgress])

  // Fetch chapter content when currentChapter changes
  useEffect(() => {
    if (!overview) return

    const fetchChapter = async () => {
      setChapterLoading(true)
      try {
        const response = await fetch(
          `/api/book/${bookId}/chapter/${currentChapter}?mode=${chunkingMode}`,
        )
        if (!response.ok) throw new Error('Failed to load chapter')
        const data: ParsedChapter = await response.json()
        setChapterData(data)
      } catch (e) {
        console.error('Failed to fetch chapter:', e)
      } finally {
        setChapterLoading(false)
      }
    }

    fetchChapter()
  }, [bookId, overview, currentChapter, chunkingMode])

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

  const showChapterLoading = useDebouncedLoading(chapterLoading)
  const currentProgress = getProgress(bookId)

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
            <div className="flex items-center gap-2">
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
              {showChapterLoading && <SpinnerIcon className="w-4 h-4 animate-spin text-gray-400" />}
            </div>
          </div>
        )}

        <ProgressIndicator
          chapter={currentChapter}
          sentence={currentSentence}
          progress={currentProgress}
        />
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
