'use client'

import { Tooltip } from '@/components/Tooltip/Tooltip'
import { useAudioPlayer } from '@/lib/hooks/useAudioPlayer/useAudioPlayer'
import { useBookPosition } from '@/lib/hooks/useBookPosition/useBookPosition'
import { useBookVoice } from '@/lib/hooks/useBookVoice/useBookVoice'
import { useDebouncedLoading } from '@/lib/hooks/useDebouncedLoading/useDebouncedLoading'
import { usePrefetchQueue } from '@/lib/hooks/usePrefetchQueue/usePrefetchQueue'
import { useVoices } from '@/lib/hooks/useVoices/useVoices'
import type { ChapterInfo } from '@/lib/types/book'
import type { PlaybackMetrics } from '@/lib/types/debug'
import { usePrefetchStore } from '@/store/usePrefetchStore'
import { Bookmark } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { PlaybackControls } from './PlaybackControls'

interface PlayerContainerProps {
  bookId: string
  chapters: ChapterInfo[]
  currentChapter: number
  currentSentence: number
  onProgressChange: (chapter: number, sentence: number) => void
  onDebugUpdate?: (updater: (prev: PlaybackMetrics) => PlaybackMetrics) => void
  isCurrentBookmarked?: boolean
  onBookmarkToggle?: () => void
  onChapterEnd?: () => void
  replayKey?: number
}

export const PlayerContainer = ({
  bookId,
  chapters,
  currentChapter,
  currentSentence,
  onProgressChange,
  onDebugUpdate,
  isCurrentBookmarked,
  onBookmarkToggle,
  onChapterEnd,
  replayKey = 0,
}: PlayerContainerProps) => {
  const { voices } = useVoices()
  const voiceNames = useMemo(() => voices.map(v => v.name), [voices])
  const { effectiveVoice: voice } = useBookVoice(bookId, voiceNames)
  const prefetchEnabled = usePrefetchStore(s => s.enabled)
  const playingPositionRef = useRef<{ ch: number; sent: number } | null>(null)
  const pendingChapterAdvanceRef = useRef(false)
  const prevReplayKeyRef = useRef(replayKey)
  const onChapterEndRef = useRef(onChapterEnd)

  useEffect(() => {
    onChapterEndRef.current = onChapterEnd
  })

  const position = useBookPosition({
    chapters,
    currentChapter,
    currentSentence,
    onProgressChange,
  })

  const audioPlayer = useAudioPlayer({
    onEnded: () => {
      const next = position.getNextPosition(
        position.currentChapterRef.current,
        position.currentSentenceRef.current,
      )

      if (!next) {
        // End of book
        playingPositionRef.current = null
        audioPlayer.setPlaying(false)
        return
      }

      // Check for chapter boundary
      if (next.ch !== position.currentChapterRef.current) {
        pendingChapterAdvanceRef.current = true
        audioPlayer.setPlaying(false)
        onChapterEndRef.current?.()
        return
      }

      position.onProgressChangeRef.current(next.ch, next.sent)
    },
  })

  const prefetch = usePrefetchQueue({
    bookId,
    voice,
    chaptersRef: position.chaptersRef,
    currentChapterRef: position.currentChapterRef,
    currentSentenceRef: position.currentSentenceRef,
    onDebugUpdate,
    prefetchEnabled,
  })

  const { setLoading, setError, play, resume, shouldPlay, pause, stop, setPlaying, isPlaying } =
    audioPlayer
  const { fetchAudio, continuePrefetching, updateDebugMetrics, resetFailures, clearPrefetched } =
    prefetch

  // Counter to detect when a newer playCurrentSentence call has superseded this one
  const playIdRef = useRef(0)

  const playCurrentSentence = useCallback(async () => {
    const myId = ++playIdRef.current
    const targetChapter = currentChapter
    const targetSentence = currentSentence

    // Stop old audio immediately so its onEnded won't fire during fetch
    stop()
    setLoading(true)
    setError(null)

    try {
      const url = await fetchAudio(targetChapter, targetSentence)

      // Bail if a newer call has started
      if (playIdRef.current !== myId) return

      if (!url) {
        setLoading(false)
        return
      }

      // Check if position changed while fetching
      if (
        position.currentChapterRef.current !== targetChapter ||
        position.currentSentenceRef.current !== targetSentence
      ) {
        setLoading(false)
        return
      }

      // Check if user paused while loading
      if (!shouldPlay()) {
        setLoading(false)
        return
      }

      playingPositionRef.current = { ch: targetChapter, sent: targetSentence }
      await play(url)

      // Bail if superseded during play
      if (playIdRef.current !== myId) return

      continuePrefetching()
    } catch (e) {
      if (playIdRef.current !== myId) return
      if (e instanceof Error && e.name === 'AbortError') return
      const message =
        e instanceof DOMException && e.name === 'TimeoutError'
          ? 'TTS generation timed out — try skipping to the next paragraph'
          : e instanceof Error
            ? e.message
            : 'Failed to play audio'
      setError(message)
      setPlaying(false)
    } finally {
      // Only the latest call controls loading state
      if (playIdRef.current === myId) {
        setLoading(false)
      }
    }
  }, [
    currentChapter,
    currentSentence,
    setLoading,
    setError,
    fetchAudio,
    shouldPlay,
    play,
    stop,
    continuePrefetching,
    setPlaying,
    position.currentChapterRef,
    position.currentSentenceRef,
  ])

  const debouncedLoading = useDebouncedLoading(audioPlayer.isLoading)

  // Start prefetching on mount
  useEffect(() => {
    prefetch.updateDebugMetrics()
    prefetch.continuePrefetching()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount for initial prefetch
  }, [])

  // Update metrics and continue prefetching on position change
  useEffect(() => {
    updateDebugMetrics()
    resetFailures()
    continuePrefetching()
  }, [currentChapter, currentSentence, updateDebugMetrics, continuePrefetching, resetFailures])

  // Clear pending chapter advance when chapter changes (user continued or navigated)
  useEffect(() => {
    pendingChapterAdvanceRef.current = false
  }, [currentChapter])

  // Play when position changes and isPlaying
  useEffect(() => {
    if (!isPlaying) return

    // Replay effect handles replayKey changes — skip to avoid double fetch
    if (replayKey !== prevReplayKeyRef.current) return

    // If at chapter boundary, re-trigger interstitial instead of replaying
    if (pendingChapterAdvanceRef.current) {
      setPlaying(false)
      onChapterEndRef.current?.()
      return
    }

    const pos = playingPositionRef.current
    const isSameSentence = pos !== null && pos.ch === currentChapter && pos.sent === currentSentence

    if (isSameSentence) {
      resume()
    } else {
      playCurrentSentence()
    }
  }, [
    isPlaying,
    currentChapter,
    currentSentence,
    replayKey,
    playCurrentSentence,
    resume,
    setPlaying,
  ])

  // Force replay on regenerate (replayKey changes)
  useEffect(() => {
    if (replayKey === prevReplayKeyRef.current) return
    prevReplayKeyRef.current = replayKey
    playingPositionRef.current = null
    clearPrefetched(currentChapter, currentSentence)
    if (isPlaying) {
      playCurrentSentence()
    } else {
      setPlaying(true)
    }
  }, [
    replayKey,
    currentChapter,
    currentSentence,
    isPlaying,
    setPlaying,
    playCurrentSentence,
    clearPrefetched,
  ])

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      setPlaying(true)
    }
  }, [isPlaying, pause, setPlaying])

  return (
    <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] dark:shadow-[0_-1px_3px_rgba(0,0,0,0.3)] px-4 py-2">
      <div className="max-w-2xl mx-auto relative">
        {audioPlayer.error && (
          <div className="text-sm text-red-600 dark:text-red-400 mb-2 text-center">
            {audioPlayer.error}
          </div>
        )}

        <PlaybackControls
          isPlaying={isPlaying}
          isLoading={debouncedLoading}
          onPlayPause={togglePlay}
          onSkipBack={position.skipBack}
          onSkipForward={position.skipForward}
        />

        {onBookmarkToggle && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <Tooltip label={isCurrentBookmarked ? 'Remove Bookmark' : 'Add Bookmark'} shortcut="B">
              <button
                onClick={onBookmarkToggle}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Bookmark
                  className={`w-5 h-5 ${
                    isCurrentBookmarked
                      ? 'text-amber-500 dark:text-amber-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                  fill={isCurrentBookmarked ? 'currentColor' : 'none'}
                />
              </button>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  )
}
