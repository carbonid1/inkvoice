'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import type { ParsedChapter } from '@/lib/types/book'
import type { DebugMetrics } from '@/components/DebugPanel'
import { useStore } from '@/store/useStore'
import { useAudioPlayer } from '@/lib/hooks/useAudioPlayer'
import { useBookPosition } from '@/lib/hooks/useBookPosition'
import { usePrefetchQueue } from '@/lib/hooks/usePrefetchQueue'
import { PlaybackControls } from './PlaybackControls'
import { ProgressIndicator } from './ProgressIndicator'

interface PlayerContainerProps {
  bookId: string
  chapters: ParsedChapter[]
  currentChapter: number
  currentSentence: number
  onProgressChange: (chapter: number, sentence: number) => void
  onDebugUpdate?: (metrics: DebugMetrics) => void
}

export function PlayerContainer({
  bookId,
  chapters,
  currentChapter,
  currentSentence,
  onProgressChange,
  onDebugUpdate,
}: PlayerContainerProps) {
  const { voice } = useStore()
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
    chaptersRef: position.chaptersRef,
    currentChapterRef: position.currentChapterRef,
    currentSentenceRef: position.currentSentenceRef,
    onDebugUpdate,
  })

  const playCurrentSentence = useCallback(async () => {
    const targetChapter = currentChapter
    const targetSentence = currentSentence

    audioPlayer.setLoading(true)
    audioPlayer.setError(null)

    try {
      const url = await prefetch.fetchAudio(targetChapter, targetSentence)
      if (!url) {
        audioPlayer.setLoading(false)
        return
      }

      // Check if position changed while fetching
      if (
        position.currentChapterRef.current !== targetChapter ||
        position.currentSentenceRef.current !== targetSentence
      ) {
        audioPlayer.setLoading(false)
        return
      }

      // Check if user paused while loading
      if (!audioPlayer.shouldPlay()) {
        audioPlayer.setLoading(false)
        return
      }

      playingPositionRef.current = { ch: targetChapter, sent: targetSentence }
      await audioPlayer.play(url)
      prefetch.continuePrefetching()
    } catch (e) {
      audioPlayer.setError(e instanceof Error ? e.message : 'Failed to play audio')
      audioPlayer.setPlaying(false)
    } finally {
      audioPlayer.setLoading(false)
    }
  }, [currentChapter, currentSentence, audioPlayer, prefetch, position])

  // Start prefetching on mount
  useEffect(() => {
    prefetch.updateDebugMetrics()
    prefetch.continuePrefetching()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update metrics and continue prefetching on position change
  useEffect(() => {
    prefetch.updateDebugMetrics()
    prefetch.continuePrefetching()
  }, [currentChapter, currentSentence, prefetch])

  // Play when position changes and isPlaying
  useEffect(() => {
    if (audioPlayer.isPlaying) {
      playCurrentSentence()
    }
  }, [audioPlayer.isPlaying, currentChapter, currentSentence, playCurrentSentence])

  const togglePlay = useCallback(() => {
    if (audioPlayer.isPlaying) {
      audioPlayer.pause()
    } else {
      audioPlayer.setPlaying(true)
    }
  }, [audioPlayer])

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
          isPlaying={audioPlayer.isPlaying}
          isLoading={audioPlayer.isLoading}
          onPlayPause={togglePlay}
          onSkipBack={position.skipBack}
          onSkipForward={position.skipForward}
        />

        <ProgressIndicator
          currentSentence={position.currentSentence}
          totalSentences={position.totalSentences}
          currentChapter={position.currentChapter}
          totalChapters={position.totalChapters}
        />
      </div>
    </div>
  )
}
