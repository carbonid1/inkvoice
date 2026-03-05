'use client'

import { BookmarkIcon } from '@/components/icons/BookmarkIcon'
import { ChevronLeftIcon } from '@/components/icons/ChevronLeftIcon'
import { SpinnerIcon } from '@/components/icons/SpinnerIcon'
import { Select } from '@/components/Select/Select'
import { Tooltip } from '@/components/Tooltip/Tooltip'
import { useBookmarkToggle } from '@/lib/hooks/useBookmarkToggle/useBookmarkToggle'
import { useDebouncedLoading } from '@/lib/hooks/useDebouncedLoading/useDebouncedLoading'
import type { ParsedChapter } from '@/lib/types/book'
import type { DebugMetrics, PlaybackMetrics } from '@/lib/types/debug'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { useDisplayStore } from '@/store/useDisplayStore'
import { useProgressStore } from '@/store/useProgressStore'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { BookmarkDrawer } from './components/BookmarkDrawer/BookmarkDrawer'
import { DebugPanel } from './components/DebugPanel/DebugPanel'
import { PlayerContainer } from './components/player/PlayerContainer'
import { ProgressIndicator } from './components/ProgressIndicator/ProgressIndicator'
import { Reader } from './components/Reader/Reader'
import { RecoveryBanner } from './components/RecoveryBanner/RecoveryBanner'
import { VoiceSelector } from './components/VoiceSelector/VoiceSelector'
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
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [playbackMetrics, setPlaybackMetrics] = useState<PlaybackMetrics>({
    isGenerating: false,
    ahead: 0,
    cacheUsedMB: 0,
    cacheMaxMB: 800,
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

  // Bookmarks
  const fetchBookmarks = useBookmarkStore(s => s.fetchBookmarks)
  const bookmarksForBook = useBookmarkStore(s => s.bookmarks[bookId] ?? [])
  const { isBookmarked: isCurrentBookmarked, toggle: toggleBookmark } = useBookmarkToggle({
    bookId,
    chapter: currentChapter,
    sentence: currentSentence,
    preview: chapterData?.sentences[currentSentence]?.trim() || undefined,
  })
  const bookmarkedSentences = useMemo(
    () => new Set(bookmarksForBook.filter(b => b.chapter === currentChapter).map(b => b.sentence)),
    [bookmarksForBook, currentChapter],
  )

  useEffect(() => {
    fetchBookmarks(bookId)
  }, [bookId, fetchBookmarks])

  // Keyboard shortcuts
  useHotkeys('d', () => setShowDebug(prev => !prev))
  useHotkeys('b', toggleBookmark)
  useHotkeys('shift+b', () => setDrawerOpen(prev => !prev))

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

  const chapterNames = overview.chapters.map(ch => ch.title)

  const recoveryBookmark =
    bookmarksForBook.length > 0
      ? bookmarksForBook.reduce((latest, b) => (b.createdAt > latest.createdAt ? b : latest))
      : undefined

  const showRecoveryBanner =
    recoveryBookmark !== undefined &&
    (recoveryBookmark.chapter !== currentChapter || recoveryBookmark.sentence !== currentSentence)

  const currentChapterInfo = overview.chapters[currentChapter] ?? {
    title: '',
    sentenceCount: 0,
    wordCount: 0,
  }

  const debugMetrics: DebugMetrics = {
    ...playbackMetrics,
    currentSentence,
    totalSentences: currentChapterInfo.sentenceCount,
    currentChapter,
    totalChapters: overview.chapters.length,
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <Tooltip label="Back to Library" position="bottom">
            <Link
              href="/"
              className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <ChevronLeftIcon />
            </Link>
          </Tooltip>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold truncate">{overview.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{overview.author}</p>
          </div>
          <Tooltip label="Bookmarks" shortcut="Shift+B" position="bottom">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 -mr-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <BookmarkIcon className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>

        <div className="max-w-3xl mx-auto px-4 pb-2">
          <div className="flex items-center gap-2">
            {overview.chapters.length > 1 && (
              <div className="flex-1 min-w-0">
                <Select
                  value={String(currentChapter)}
                  onChange={v => {
                    const chapter = Number(v)
                    const saved = getProgress(bookId).chapterPositions?.[chapter] ?? 0
                    handleProgressChange(chapter, saved)
                  }}
                  options={overview.chapters.map((chapter, idx) => ({
                    value: String(idx),
                    label: chapter.title,
                  }))}
                  aria-label="Chapter"
                  className="w-full text-sm bg-gray-100 dark:bg-gray-800 border-none rounded px-2 py-1 text-left"
                />
              </div>
            )}
            {showChapterLoading && <SpinnerIcon className="w-4 h-4 animate-spin text-gray-400" />}
            <VoiceSelector bookId={bookId} />
          </div>
        </div>

        <ProgressIndicator
          chapter={currentChapter}
          sentence={currentSentence}
          progress={currentProgress}
          chapterInfo={currentChapterInfo}
        />
      </header>

      <main className="max-w-3xl mx-auto">
        {showRecoveryBanner && recoveryBookmark && (
          <RecoveryBanner
            chapterName={
              chapterNames[recoveryBookmark.chapter] ?? `Chapter ${recoveryBookmark.chapter + 1}`
            }
            sentence={recoveryBookmark.sentence}
            chunkingMode={chunkingMode}
            onNavigate={() =>
              handleProgressChange(recoveryBookmark.chapter, recoveryBookmark.sentence)
            }
          />
        )}
        {chapterData ? (
          <Reader
            chapter={chapterData}
            currentChapter={currentChapter}
            currentSentence={currentSentence}
            onSentenceClick={handleSentenceClick}
            bookmarkedSentences={bookmarkedSentences}
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
        onDebugUpdate={setPlaybackMetrics}
        isCurrentBookmarked={isCurrentBookmarked}
        onBookmarkToggle={toggleBookmark}
      />

      <DebugPanel metrics={debugMetrics} visible={showDebug} />

      <BookmarkDrawer
        bookId={bookId}
        isOpen={drawerOpen}
        chunkingMode={chunkingMode}
        onClose={() => setDrawerOpen(false)}
        onNavigate={handleProgressChange}
        chapterNames={chapterNames}
      />
    </div>
  )
}
