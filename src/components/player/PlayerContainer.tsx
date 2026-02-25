'use client'

import type { PlaybackMetrics } from '@/components/DebugPanel'
import { useAudioPlayer } from '@/lib/hooks/useAudioPlayer/useAudioPlayer'
import { useBookPosition } from '@/lib/hooks/useBookPosition/useBookPosition'
import { useDebouncedLoading } from '@/lib/hooks/useDebouncedLoading/useDebouncedLoading'
import { usePrefetchQueue } from '@/lib/hooks/usePrefetchQueue/usePrefetchQueue'
import type { ChapterInfo } from '@/lib/types/book'
import { useDisplayStore } from '@/store/useDisplayStore'
import { usePrefetchStore } from '@/store/usePrefetchStore'
import { usePronunciationStore } from '@/store/usePronunciationStore'
import { useVoiceStore } from '@/store/useVoiceStore'
import { useCallback, useEffect, useRef } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { PlaybackControls } from './PlaybackControls'

interface PlayerContainerProps {
  bookId: string
  chapters: ChapterInfo[]
  currentChapter: number
  currentSentence: number
  onProgressChange: (chapter: number, sentence: number) => void
  onDebugUpdate?: (updater: (prev: PlaybackMetrics) => PlaybackMetrics) => void
}

export const PlayerContainer = ({
  bookId,
  chapters,
  currentChapter,
  currentSentence,
  onProgressChange,
  onDebugUpdate,
}: PlayerContainerProps) => {
  const voice = useVoiceStore(s => s.voice)
  const chunkingMode = useDisplayStore(s => s.chunkingMode)
  const prefetchEnabled = usePrefetchStore(s => s.enabled)
  const pronunciationVersion = usePronunciationStore(s => s.version)
  const playingPositionRef = useRef<{ ch: number; sent: number } | null>(null)

  const position = useBookPosition({
    chapters,
    currentChapter,
    currentSentence,
    onProgressChange,
  })

  const audioPlayer = useAudioPlayer({
    onEnded: () => {
      if (!position.advanceToNext()) {
        playingPositionRef.current = null
        audioPlayer.setPlaying(false)
      }
    },
  })

  const prefetch = usePrefetchQueue({
    bookId,
    voice,
    pronunciationVersion,
    chunkingMode,
    chaptersRef: position.chaptersRef,
    currentChapterRef: position.currentChapterRef,
    currentSentenceRef: position.currentSentenceRef,
    onDebugUpdate,
    prefetchEnabled,
  })

  const { setLoading, setError, play, resume, shouldPlay, pause, stop, setPlaying, isPlaying } =
    audioPlayer
  const { fetchAudio, continuePrefetching, updateDebugMetrics, resetFailures } = prefetch

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

  // Play when position changes and isPlaying
  useEffect(() => {
    if (!isPlaying) return

    const pos = playingPositionRef.current
    const isSameSentence = pos !== null && pos.ch === currentChapter && pos.sent === currentSentence

    if (isSameSentence) {
      resume()
    } else {
      playCurrentSentence()
    }
  }, [isPlaying, currentChapter, currentSentence, playCurrentSentence, resume])

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      setPlaying(true)
    }
  }, [isPlaying, pause, setPlaying])

  // Space to toggle play/pause
  useHotkeys('space', togglePlay, { preventDefault: true })

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="max-w-2xl mx-auto">
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
      </div>
    </div>
  )
}
