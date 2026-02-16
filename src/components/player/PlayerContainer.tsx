'use client'

import type { DebugMetrics } from '@/components/DebugPanel'
import { useAudioPlayer } from '@/lib/hooks/useAudioPlayer/useAudioPlayer'
import { useBookPosition } from '@/lib/hooks/useBookPosition/useBookPosition'
import { usePrefetchQueue } from '@/lib/hooks/usePrefetchQueue/usePrefetchQueue'
import type { ChapterInfo } from '@/lib/types/book'
import { useDebouncedLoading } from '@/lib/hooks/useDebouncedLoading/useDebouncedLoading'
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
  onDebugUpdate?: (updater: (prev: DebugMetrics) => DebugMetrics) => void
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
        audioPlayer.setPlaying(false)
      }
    },
  })

  const prefetch = usePrefetchQueue({
    bookId,
    voice,
    pronunciationVersion,
    chaptersRef: position.chaptersRef,
    currentChapterRef: position.currentChapterRef,
    currentSentenceRef: position.currentSentenceRef,
    onDebugUpdate,
    prefetchEnabled,
  })

  const { setLoading, setError, play, shouldPlay, pause, setPlaying, isPlaying } = audioPlayer
  const { fetchAudio, continuePrefetching, updateDebugMetrics, resetFailures } = prefetch

  const playCurrentSentence = useCallback(async () => {
    const targetChapter = currentChapter
    const targetSentence = currentSentence

    setLoading(true)
    setError(null)

    try {
      const url = await fetchAudio(targetChapter, targetSentence)
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
      continuePrefetching()
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return
      setError(e instanceof Error ? e.message : 'Failed to play audio')
      setPlaying(false)
    } finally {
      setLoading(false)
    }
  }, [
    currentChapter,
    currentSentence,
    setLoading,
    setError,
    fetchAudio,
    shouldPlay,
    play,
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
    if (isPlaying) {
      playCurrentSentence()
    }
  }, [isPlaying, currentChapter, currentSentence, playCurrentSentence])

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
