'use client'

import { Tooltip } from '@/components/Tooltip/Tooltip'
import { Button } from '@/components/ui/Button/Button'
import { parseTimestampsHeader } from '@/lib/helpers/parseTimestampsHeader/parseTimestampsHeader'
import { useAudioPlayer } from '@/lib/hooks/useAudioPlayer/useAudioPlayer'
import { useBookPosition } from '@/lib/hooks/useBookPosition/useBookPosition'
import { useBookVoice } from '@/lib/hooks/useBookVoice/useBookVoice'
import { useDebouncedLoading } from '@/lib/hooks/useDebouncedLoading/useDebouncedLoading'
import { useVoices } from '@/lib/hooks/useVoices/useVoices'
import { useWordHighlight } from '@/lib/hooks/useWordHighlight/useWordHighlight'
import { DEFAULT_VOICE } from '@/lib/services/voice/voice.consts'
import type { ChapterInfo } from '@/lib/types/book'
import type { WordTimestamp } from '@/lib/types/wordTimestamp'
import { Bookmark } from 'lucide-react'
import type { RefObject } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

  const { setLoading, setError, play, resume, shouldPlay, pause, stop, setPlaying, isPlaying } =
    audioPlayer

  const abortRef = useRef<AbortController | null>(null)
  const blobUrlRef = useRef<string | null>(null)

  // Abort in-flight fetches on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    }
  }, [])

  const fetchAudio = useCallback(
    async (ch: number, para: number, signal: AbortSignal) => {
      const url = `/api/tts/${bookId}/${ch}/${para}?voice=${encodeURIComponent(voice ?? DEFAULT_VOICE)}`
      const response = await fetch(url, { cache: 'no-store', signal })
      if (!response.ok) return null
      const timestamps = parseTimestampsHeader(response)
      const blob = await response.blob()
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
      const blobUrl = URL.createObjectURL(blob)
      blobUrlRef.current = blobUrl
      return { url: blobUrl, timestamps }
    },
    [bookId, voice],
  )

  // Counter to detect when a newer playCurrentParagraph call has superseded this one
  const playIdRef = useRef(0)

  const playCurrentParagraph = useCallback(async () => {
    const myId = ++playIdRef.current
    const targetChapter = currentChapter
    const targetParagraph = currentParagraph

    // Abort previous fetch if still in flight
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    // Stop old audio immediately so its onEnded won't fire during fetch
    stop()
    setLoading(true)
    setError(null)

    try {
      const result = await fetchAudio(targetChapter, targetParagraph, controller.signal)

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
    } catch (e) {
      if (playIdRef.current !== myId) return
      if (e instanceof Error && e.name === 'AbortError') return
      setError(e instanceof Error ? e.message : 'Failed to play audio')
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
    setPlaying,
    position.currentChapterRef,
    position.currentParagraphRef,
  ])

  const debouncedLoading = useDebouncedLoading(audioPlayer.isLoading)

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
    if (isPlaying) {
      playCurrentParagraph()
    } else {
      setPlaying(true)
    }
  }, [replayKey, currentChapter, currentParagraph, isPlaying, setPlaying, playCurrentParagraph])

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
          <div className="text-destructive mb-2 text-center text-sm">{audioPlayer.error}</div>
        )}

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
