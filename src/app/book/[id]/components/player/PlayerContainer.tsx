'use client'

import { Tooltip } from '@/components/Tooltip/Tooltip'
import { Button } from '@/components/ui/Button/Button'
import { useAudioPlayer } from '@/lib/hooks/useAudioPlayer/useAudioPlayer'
import { useBookPosition } from '@/lib/hooks/useBookPosition/useBookPosition'
import { useBookVoice } from '@/lib/hooks/useBookVoice/useBookVoice'
import { useDebouncedLoading } from '@/lib/hooks/useDebouncedLoading/useDebouncedLoading'
import type { PlaybackMetrics } from '@/lib/hooks/usePrefetchQueue/usePrefetchQueue'
import { usePrefetchQueue } from '@/lib/hooks/usePrefetchQueue/usePrefetchQueue'
import { useVoices } from '@/lib/hooks/useVoices/useVoices'
import { useWordHighlight } from '@/lib/hooks/useWordHighlight/useWordHighlight'
import type { ChapterInfo } from '@/lib/types/book'
import type { WordTimestamp } from '@/lib/types/wordTimestamp'
import { Bookmark } from 'lucide-react'
import type { RefObject } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BufferRing } from './BufferRing/BufferRing'
import { PlaybackControls } from './PlaybackControls'

interface PlayerContainerProps {
  bookId: string
  chapters: ChapterInfo[]
  currentChapter: number
  currentParagraph: number
  onProgressChange: (chapter: number, paragraph: number) => void
  isCurrentBookmarked?: boolean
  onBookmarkToggle?: () => void
  onChapterEnd?: () => void
  replayKey?: number
  activeParagraphRef?: RefObject<HTMLSpanElement | null>
}

export const PlayerContainer = ({
  bookId,
  chapters,
  currentChapter,
  currentParagraph,
  onProgressChange,
  isCurrentBookmarked,
  onBookmarkToggle,
  onChapterEnd,
  replayKey = 0,
  activeParagraphRef,
}: PlayerContainerProps) => {
  const { voices } = useVoices()
  const voiceNames = useMemo(() => voices.map(v => v.name), [voices])
  const { effectiveVoice: voice } = useBookVoice(bookId, voiceNames)
  const playingPositionRef = useRef<{ ch: number; para: number } | null>(null)
  const pendingChapterAdvanceRef = useRef(false)
  const prevReplayKeyRef = useRef(replayKey)
  const onChapterEndRef = useRef(onChapterEnd)

  useEffect(() => {
    onChapterEndRef.current = onChapterEnd
  })

  const position = useBookPosition({
    chapters,
    currentChapter,
    currentParagraph,
    onProgressChange,
  })

  const [wordTimestamps, setWordTimestamps] = useState<WordTimestamp[] | null>(null)
  const [playbackMetrics, setPlaybackMetrics] = useState<PlaybackMetrics>({
    isGenerating: false,
    ahead: 0,
  })

  const audioPlayer = useAudioPlayer({
    onEnded: () => {
      const next = position.getNextPosition(
        position.currentChapterRef.current,
        position.currentParagraphRef.current,
      )

      if (!next) {
        // End of book
        playingPositionRef.current = null
        setWordTimestamps(null)
        audioPlayer.setPlaying(false)
        return
      }

      // Check for chapter boundary
      if (next.ch !== position.currentChapterRef.current) {
        pendingChapterAdvanceRef.current = true
        setWordTimestamps(null)
        audioPlayer.setPlaying(false)
        onChapterEndRef.current?.()
        return
      }

      position.onProgressChangeRef.current(next.ch, next.para)
    },
  })

  const prefetch = usePrefetchQueue({
    bookId,
    voice,
    chaptersRef: position.chaptersRef,
    currentChapterRef: position.currentChapterRef,
    currentParagraphRef: position.currentParagraphRef,
    onDebugUpdate: setPlaybackMetrics,
  })

  const { setLoading, setError, play, resume, shouldPlay, pause, stop, setPlaying, isPlaying } =
    audioPlayer
  const { fetchAudio, continuePrefetching, updateDebugMetrics, resetFailures, clearPrefetched } =
    prefetch

  // Counter to detect when a newer playCurrentParagraph call has superseded this one
  const playIdRef = useRef(0)

  const playCurrentParagraph = useCallback(async () => {
    const myId = ++playIdRef.current
    const targetChapter = currentChapter
    const targetParagraph = currentParagraph

    // Stop old audio immediately so its onEnded won't fire during fetch
    stop()
    setLoading(true)
    setError(null)

    try {
      const result = await fetchAudio(targetChapter, targetParagraph)

      // Bail if a newer call has started
      if (playIdRef.current !== myId) return

      if (!result) {
        setLoading(false)
        return
      }

      // Check if position changed while fetching
      if (
        position.currentChapterRef.current !== targetChapter ||
        position.currentParagraphRef.current !== targetParagraph
      ) {
        setLoading(false)
        return
      }

      // Check if user paused while loading
      if (!shouldPlay()) {
        setLoading(false)
        return
      }

      playingPositionRef.current = { ch: targetChapter, para: targetParagraph }
      setWordTimestamps(result.timestamps)
      await play(result.url)

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
    currentParagraph,
    setLoading,
    setError,
    fetchAudio,
    shouldPlay,
    play,
    stop,
    continuePrefetching,
    setPlaying,
    position.currentChapterRef,
    position.currentParagraphRef,
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
  }, [currentChapter, currentParagraph, updateDebugMetrics, continuePrefetching, resetFailures])

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
    const isSameParagraph =
      pos !== null && pos.ch === currentChapter && pos.para === currentParagraph

    if (isSameParagraph) {
      resume()
    } else {
      playCurrentParagraph()
    }
  }, [
    isPlaying,
    currentChapter,
    currentParagraph,
    replayKey,
    playCurrentParagraph,
    resume,
    setPlaying,
  ])

  // Force replay on regenerate (replayKey changes)
  useEffect(() => {
    if (replayKey === prevReplayKeyRef.current) return
    prevReplayKeyRef.current = replayKey
    playingPositionRef.current = null
    clearPrefetched(currentChapter, currentParagraph)
    if (isPlaying) {
      playCurrentParagraph()
    } else {
      setPlaying(true)
    }
  }, [
    replayKey,
    currentChapter,
    currentParagraph,
    isPlaying,
    setPlaying,
    playCurrentParagraph,
    clearPrefetched,
  ])

  useWordHighlight({
    audioRef: audioPlayer.audioRef,
    timestamps: wordTimestamps,
    paragraphRef: activeParagraphRef ?? { current: null },
    isPlaying,
  })

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      setPlaying(true)
    }
  }, [isPlaying, pause, setPlaying])

  return (
    <div className="border-border bg-background shrink-0 border-t px-4 py-2 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] dark:shadow-[0_-1px_3px_rgba(0,0,0,0.3)]">
      <div className="relative mx-auto max-w-2xl">
        {audioPlayer.error && (
          <div className="mb-2 text-center text-sm text-red-600 dark:text-red-400">
            {audioPlayer.error}
          </div>
        )}

        <div className="absolute top-1/2 left-0 -translate-y-1/2">
          <BufferRing ahead={playbackMetrics.ahead} isGenerating={playbackMetrics.isGenerating} />
        </div>

        <PlaybackControls
          isPlaying={isPlaying}
          isLoading={debouncedLoading}
          onPlayPause={togglePlay}
          onSkipBack={position.skipBack}
          onSkipForward={position.skipForward}
        />

        {onBookmarkToggle && (
          <div className="absolute top-1/2 right-0 -translate-y-1/2">
            <Tooltip label={isCurrentBookmarked ? 'Remove Bookmark' : 'Add Bookmark'} shortcut="B">
              <Button size="icon" onClick={onBookmarkToggle}>
                <Bookmark
                  className={isCurrentBookmarked ? 'text-attention' : 'text-muted-foreground'}
                  fill={isCurrentBookmarked ? 'currentColor' : 'none'}
                />
              </Button>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  )
}
