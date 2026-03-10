'use client'

import { PageHeader } from '@/components/PageHeader/PageHeader'
import { Tooltip } from '@/components/Tooltip/Tooltip'
import { getModKey } from '@/lib/helpers/getModKey/getModKey'
import { useBookmarkToggle } from '@/lib/hooks/useBookmarkToggle/useBookmarkToggle'
import { useBookVoice } from '@/lib/hooks/useBookVoice/useBookVoice'
import { useDebouncedLoading } from '@/lib/hooks/useDebouncedLoading/useDebouncedLoading'
import type { ParsedChapter } from '@/lib/types/book'
import type { DebugMetrics, PlaybackMetrics } from '@/lib/types/debug'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { useProgressStore } from '@/store/useProgressStore'
import { BookMarked, ChevronLeft, List, Loader2, Search } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { MouseEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { toast } from 'sonner'
import { BookmarkDrawer } from './components/BookmarkDrawer/BookmarkDrawer'
import { ChapterDrawer } from './components/ChapterDrawer/ChapterDrawer'
import { ChapterEndModal } from './components/ChapterEndModal/ChapterEndModal'
import { DebugPanel } from './components/DebugPanel/DebugPanel'
import { FontSizePopover } from './components/FontSizePopover/FontSizePopover'
import { PageSkeleton } from './components/PageSkeleton/PageSkeleton'
import { PlayerContainer } from './components/player/PlayerContainer'
import { ProgressIndicator } from './components/ProgressIndicator/ProgressIndicator'
import { Reader } from './components/Reader/Reader'
import { RecoveryBanner } from './components/RecoveryBanner/RecoveryBanner'
import { SearchBar } from './components/SearchBar/SearchBar'
import {
  SentenceContextMenu,
  type ContextMenuTarget,
} from './components/SentenceContextMenu/SentenceContextMenu'
import { VoiceSelector } from './components/VoiceSelector/VoiceSelector'
import { WORDS_PER_PAGE } from './helpers/computePagePosition/computePagePosition'
import { shouldShowChapterProgress } from './helpers/shouldShowChapterProgress/shouldShowChapterProgress'
import { useBookOverview } from './hooks/useBookOverview/useBookOverview'
import { useBookSearch } from './hooks/useBookSearch/useBookSearch'

export default function BookReader() {
  const params = useParams()
  const bookId = params.id as string

  const { effectiveVoice } = useBookVoice(bookId)
  const { overview, loading, error, initialChapter, initialSentence } = useBookOverview(bookId)
  const search = useBookSearch(bookId)

  const [chapterData, setChapterData] = useState<ParsedChapter | null>(null)
  const [currentChapter, setCurrentChapter] = useState(initialChapter)
  const [currentSentence, setCurrentSentence] = useState(initialSentence)
  const [chapterLoading, setChapterLoading] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [activeDrawer, setActiveDrawer] = useState<'chapter' | 'bookmark' | null>(null)
  const [contextMenuTarget, setContextMenuTarget] = useState<ContextMenuTarget | null>(null)
  const [showChapterEndModal, setShowChapterEndModal] = useState(false)
  const [replayKey, setReplayKey] = useState(0)

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

  // Fetch chapter content when currentChapter changes
  useEffect(() => {
    if (!overview) return

    const fetchChapter = async () => {
      setChapterLoading(true)
      try {
        const response = await fetch(`/api/book/${bookId}/chapter/${currentChapter}`)
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

  const handleSentenceContextMenu = useCallback(
    (e: MouseEvent, chapter: number, sentence: number) => {
      e.preventDefault()
      setContextMenuTarget({ x: e.clientX, y: e.clientY, chapter, sentence })
    },
    [],
  )

  const handleCloseContextMenu = useCallback(() => setContextMenuTarget(null), [])

  const handleRegenerate = useCallback(
    (chapter: number, sentence: number) => {
      const params = new URLSearchParams({ voice: effectiveVoice })
      fetch(`/api/tts/${bookId}/${chapter}/${sentence}?${params}`, { method: 'DELETE' }).catch(
        console.error,
      )
      if (chapter !== currentChapter || sentence !== currentSentence) {
        handleProgressChange(chapter, sentence)
      }
      setReplayKey(k => k + 1)
    },
    [bookId, effectiveVoice, currentChapter, currentSentence, handleProgressChange],
  )

  // Chapter end interstitial
  const handleChapterEnd = useCallback(() => setShowChapterEndModal(true), [])
  const handleContinueChapter = useCallback(() => {
    setShowChapterEndModal(false)
    handleProgressChange(currentChapter + 1, 0)
  }, [currentChapter, handleProgressChange])
  const handleDismissChapterEnd = useCallback(() => setShowChapterEndModal(false), [])

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
  useHotkeys('shift+b', () => setActiveDrawer(prev => (prev === 'bookmark' ? null : 'bookmark')))
  useHotkeys('t', () => setActiveDrawer(prev => (prev === 'chapter' ? null : 'chapter')))
  useHotkeys(
    'mod+f',
    e => {
      e.preventDefault()
      search.open()
    },
    { preventDefault: true },
  )
  useHotkeys('escape', () => search.close(), { enabled: search.isOpen })
  useHotkeys('mod+z', () => {
    const { lastDeleted, undoRemoveBookmark } = useBookmarkStore.getState()
    if (!lastDeleted) return
    undoRemoveBookmark()
    toast.dismiss()
  })

  // Drawer callbacks
  const closeDrawer = useCallback(() => setActiveDrawer(null), [])
  const handleChapterNavigate = useCallback(
    (chapter: number) => {
      const saved = getProgress(bookId).chapterPositions?.[chapter] ?? 0
      handleProgressChange(chapter, saved)
    },
    [bookId, getProgress, handleProgressChange],
  )

  // Search: navigate to current match when it changes
  const prevSearchMatchRef = useRef<{ chapter: number; sentence: number } | null>(null)
  useEffect(() => {
    const match = search.currentMatch
    if (!match) {
      prevSearchMatchRef.current = null
      return
    }
    const prev = prevSearchMatchRef.current
    if (prev && prev.chapter === match.chapter && prev.sentence === match.sentence) return
    prevSearchMatchRef.current = { chapter: match.chapter, sentence: match.sentence }
    handleSentenceClick(match.chapter, match.sentence)
  }, [search.currentMatch, handleSentenceClick])

  const showChapterLoading = useDebouncedLoading(chapterLoading)
  const currentProgress = getProgress(bookId)

  const chapterNames = useMemo(
    () => overview?.chapters.map(ch => ch.title) ?? [],
    [overview?.chapters],
  )

  const recoveryBookmark = useMemo(
    () =>
      bookmarksForBook.length > 0
        ? bookmarksForBook.reduce((furthest, b) =>
            b.chapter > furthest.chapter ||
            (b.chapter === furthest.chapter && b.sentence > furthest.sentence)
              ? b
              : furthest,
          )
        : undefined,
    [bookmarksForBook],
  )

  if (loading) return <PageSkeleton />

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

  const showRecoveryBanner =
    recoveryBookmark !== undefined &&
    (recoveryBookmark.chapter !== currentChapter || recoveryBookmark.sentence !== currentSentence)

  const currentChapterInfo = overview.chapters[currentChapter] ?? {
    title: '',
    sentenceCount: 0,
    wordCount: 0,
  }

  const nextChapter = overview.chapters[currentChapter + 1]
  const nextChapterPageCount =
    nextChapter && shouldShowChapterProgress({ wordsInChapter: nextChapter.wordCount })
      ? Math.ceil(nextChapter.wordCount / WORDS_PER_PAGE)
      : null

  const debugMetrics: DebugMetrics = {
    ...playbackMetrics,
    currentSentence,
    totalSentences: currentChapterInfo.sentenceCount,
    currentChapter,
    totalChapters: overview.chapters.length,
  }

  return (
    <div className="h-dvh flex flex-col">
      <PageHeader>
        <div className="max-w-3xl mx-auto px-4 py-2 flex items-center gap-4">
          <Tooltip label="Back to Library" position="bottom">
            <Link
              href="/"
              className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Tooltip>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold truncate">{overview.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{overview.author}</p>
          </div>
          <Tooltip label="Search" shortcut={`${getModKey()}+F`} position="bottom">
            <button
              onClick={() => (search.isOpen ? search.close() : search.open())}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Search in book"
            >
              <Search className="w-5 h-5" />
            </button>
          </Tooltip>
          <Tooltip label="Bookmarks" shortcut="Shift+B" position="bottom">
            <button
              onClick={() => setActiveDrawer('bookmark')}
              className="p-2 -mr-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <BookMarked className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>

        <div className="max-w-3xl mx-auto px-4 pb-1.5">
          <div className="flex items-center gap-2">
            {overview.chapters.length > 1 && (
              <Tooltip label="Table of Contents" shortcut="T" position="bottom">
                <button
                  onClick={() => setActiveDrawer('chapter')}
                  className="flex items-center gap-1.5 text-sm bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-w-0"
                  aria-label="Table of Contents"
                >
                  <List className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{currentChapterInfo.title}</span>
                </button>
              </Tooltip>
            )}
            {showChapterLoading && (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" aria-hidden="true" />
                <span className="sr-only">Loading chapter</span>
              </>
            )}
            <VoiceSelector bookId={bookId} />
            <FontSizePopover />
          </div>
        </div>

        <ProgressIndicator
          chapter={currentChapter}
          sentence={currentSentence}
          progress={currentProgress}
          chapterInfo={currentChapterInfo}
        />
      </PageHeader>

      <main className="flex-1 min-h-0 overflow-y-auto">
        {search.isOpen && (
          <SearchBar
            query={search.query}
            totalMatches={search.totalMatches}
            currentMatchIndex={search.currentMatchIndex}
            loading={search.loading}
            onQueryChange={search.setQuery}
            onNext={search.goToNextMatch}
            onPrevious={search.goToPreviousMatch}
            onClose={search.close}
          />
        )}
        <div className="max-w-3xl mx-auto">
          {showRecoveryBanner && recoveryBookmark && (
            <RecoveryBanner
              chapterName={
                chapterNames[recoveryBookmark.chapter] ?? `Chapter ${recoveryBookmark.chapter + 1}`
              }
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
              onSentenceContextMenu={handleSentenceContextMenu}
              bookmarkedSentences={bookmarkedSentences}
              searchQuery={search.isOpen ? search.query : undefined}
              activeSearchSentence={search.currentMatch?.sentence}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Loading chapter...
            </div>
          )}
        </div>
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
        onChapterEnd={handleChapterEnd}
        replayKey={replayKey}
      />

      <DebugPanel metrics={debugMetrics} visible={showDebug} />

      <ChapterDrawer
        isOpen={activeDrawer === 'chapter'}
        onClose={closeDrawer}
        onNavigate={handleChapterNavigate}
        chapters={overview.chapters}
        tocTree={overview.tocTree}
        currentChapter={currentChapter}
      />

      <BookmarkDrawer
        bookId={bookId}
        isOpen={activeDrawer === 'bookmark'}
        onClose={closeDrawer}
        onNavigate={handleProgressChange}
        chapterNames={chapterNames}
      />

      <SentenceContextMenu
        target={contextMenuTarget}
        onRegenerate={handleRegenerate}
        onClose={handleCloseContextMenu}
      />

      <ChapterEndModal
        isOpen={showChapterEndModal}
        completedChapterTitle={currentChapterInfo.title}
        nextChapterTitle={nextChapter?.title ?? ''}
        nextChapterPageCount={nextChapterPageCount}
        chaptersCompleted={currentChapter + 1}
        totalChapters={overview.chapters.length}
        onContinue={handleContinueChapter}
        onDismiss={handleDismissChapterEnd}
      />
    </div>
  )
}
