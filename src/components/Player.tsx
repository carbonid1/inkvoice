'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { ParsedChapter } from '@/lib/epub'
import { DebugMetrics } from './DebugPanel'
import { useStore } from '@/store/useStore'

interface PlayerProps {
  bookId: string
  chapters: ParsedChapter[]
  currentChapter: number
  currentSentence: number
  onProgressChange: (chapter: number, sentence: number) => void
  onDebugUpdate?: (metrics: DebugMetrics) => void
}

const MAX_CONCURRENT_PREFETCH = 1 // Sequential prefetching for consistent generation

export function Player({
  bookId,
  chapters,
  currentChapter,
  currentSentence,
  onProgressChange,
  onDebugUpdate,
}: PlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { voice } = useStore()

  // Track in-flight fetches
  const inFlightRef = useRef<Set<string>>(new Set())
  // Track what's been prefetched this session
  const prefetchedRef = useRef<Set<string>>(new Set())
  // Track cache stats from server
  const cacheStatsRef = useRef<{ usedMB: number; maxMB: number }>({ usedMB: 0, maxMB: 800 })

  // Refs to track current position for onended handler (avoids stale closure)
  const currentChapterRef = useRef(currentChapter)
  const currentSentenceRef = useRef(currentSentence)
  const chaptersRef = useRef(chapters)
  const onProgressChangeRef = useRef(onProgressChange)

  // Track what sentence is ACTUALLY playing in the audio element
  const playingChapterRef = useRef<number | null>(null)
  const playingSentenceRef = useRef<number | null>(null)
  // Track user intent to allow pausing while loading
  const wantToPlayRef = useRef(true)

  // Keep refs in sync with props
  useEffect(() => {
    currentChapterRef.current = currentChapter
    currentSentenceRef.current = currentSentence
    chaptersRef.current = chapters
    onProgressChangeRef.current = onProgressChange
  }, [currentChapter, currentSentence, chapters, onProgressChange])

  const chapter = chapters[currentChapter]
  const totalSentences = chapter?.sentences.length || 0

  // Build URL for a sentence
  const getTTSUrl = useCallback(
    (ch: number, sent: number) =>
      `/api/tts/${bookId}/${ch}/${sent}?voice=${encodeURIComponent(voice ?? 'default')}`,
    [bookId, voice]
  )

  // Cache key for tracking prefetches
  const getCacheKey = useCallback(
    (ch: number, sent: number) => `${ch}_${sent}_${voice ?? 'default'}`,
    [voice]
  )

  // Count how many sentences ahead of current position are prefetched
  const countAhead = useCallback(() => {
    let count = 0
    let ch = currentChapterRef.current
    let sent = currentSentenceRef.current

    // Count all prefetched sentences ahead of current position
    while (true) {
      sent++
      const chapterData = chaptersRef.current[ch]
      if (!chapterData || sent >= chapterData.sentences.length) {
        ch++
        sent = 0
        if (ch >= chaptersRef.current.length) break
      }
      if (prefetchedRef.current.has(getCacheKey(ch, sent))) {
        count++
      } else {
        // Stop counting at first gap
        break
      }
    }
    return count
  }, [getCacheKey])

  const updateDebugMetrics = useCallback(() => {
    onDebugUpdate?.({
      isGenerating: inFlightRef.current.size > 0,
      ahead: countAhead(),
      cacheUsedMB: cacheStatsRef.current.usedMB,
      cacheMaxMB: cacheStatsRef.current.maxMB,
    })
  }, [onDebugUpdate, countAhead])

  // Get next sentence position after given position
  const getNextPosition = useCallback((ch: number, sent: number): { ch: number; sent: number } | null => {
    const nextSent = sent + 1
    const chapterData = chapters[ch]

    if (chapterData && nextSent < chapterData.sentences.length) {
      return { ch, sent: nextSent }
    }

    // Move to next chapter
    const nextCh = ch + 1
    if (nextCh < chapters.length) {
      return { ch: nextCh, sent: 0 }
    }

    return null // End of book
  }, [chapters])

  // Find the next sentence to prefetch (first unprefetched after current position)
  const findNextToPrefetch = useCallback((): { ch: number; sent: number } | null => {
    let ch = currentChapterRef.current
    let sent = currentSentenceRef.current

    while (true) {
      const next = getNextPosition(ch, sent)
      if (!next) return null // End of book

      ch = next.ch
      sent = next.sent

      const key = getCacheKey(ch, sent)
      if (!prefetchedRef.current.has(key) && !inFlightRef.current.has(key)) {
        return { ch, sent }
      }
    }
  }, [getCacheKey, getNextPosition])

  // Continuous prefetch - keeps prefetching until book end
  const continuePrefetching = useCallback(() => {
    if (inFlightRef.current.size >= MAX_CONCURRENT_PREFETCH) return

    const next = findNextToPrefetch()
    if (!next) return // End of book

    const { ch, sent } = next
    const key = getCacheKey(ch, sent)
    const url = getTTSUrl(ch, sent)

    inFlightRef.current.add(key)
    updateDebugMetrics()

    fetch(url)
      .then((response) => {
        if (response.ok) {
          prefetchedRef.current.add(key)
          // Update cache stats from response headers
          const usedBytes = response.headers.get('X-Cache-Used')
          const maxBytes = response.headers.get('X-Cache-Max')
          if (usedBytes && maxBytes) {
            cacheStatsRef.current = {
              usedMB: Math.round(parseInt(usedBytes, 10) / (1024 * 1024)),
              maxMB: Math.round(parseInt(maxBytes, 10) / (1024 * 1024)),
            }
          }
        }
      })
      .catch(() => {
        // Ignore prefetch errors
      })
      .finally(() => {
        inFlightRef.current.delete(key)
        updateDebugMetrics()
        // Continue prefetching
        continuePrefetching()
      })
  }, [findNextToPrefetch, getCacheKey, getTTSUrl, updateDebugMetrics])

  // Fetch audio for a single sentence (for playback)
  const fetchAudio = useCallback(
    async (ch: number, sent: number): Promise<string | null> => {
      const chapterData = chapters[ch]
      if (!chapterData || sent >= chapterData.sentences.length) {
        return null
      }

      const key = getCacheKey(ch, sent)
      const url = getTTSUrl(ch, sent)

      inFlightRef.current.add(key)
      updateDebugMetrics()

      try {
        const response = await fetch(url)
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.error || 'Failed to generate audio')
        }

        // Update cache stats from response headers
        const usedBytes = response.headers.get('X-Cache-Used')
        const maxBytes = response.headers.get('X-Cache-Max')
        if (usedBytes && maxBytes) {
          cacheStatsRef.current = {
            usedMB: Math.round(parseInt(usedBytes, 10) / (1024 * 1024)),
            maxMB: Math.round(parseInt(maxBytes, 10) / (1024 * 1024)),
          }
        }

        const blob = await response.blob()
        prefetchedRef.current.add(key)
        return URL.createObjectURL(blob)
      } finally {
        inFlightRef.current.delete(key)
        updateDebugMetrics()
      }
    },
    [chapters, getCacheKey, getTTSUrl, updateDebugMetrics]
  )

  // Start prefetching on mount
  useEffect(() => {
    updateDebugMetrics()
    continuePrefetching()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- Run once on mount

  // Update metrics when position changes and continue prefetching
  useEffect(() => {
    updateDebugMetrics()
    continuePrefetching()
  }, [currentChapter, currentSentence, updateDebugMetrics, continuePrefetching])

  const playCurrentSentence = useCallback(async () => {
    // Capture the target position at the start of this call
    const targetChapter = currentChapter
    const targetSentence = currentSentence

    setIsLoading(true)
    setError(null)

    try {
      const url = await fetchAudio(targetChapter, targetSentence)
      if (!url) {
        setIsLoading(false)
        return
      }

      // Check if position changed while we were fetching
      if (currentChapterRef.current !== targetChapter || currentSentenceRef.current !== targetSentence) {
        setIsLoading(false)
        return
      }

      // Check if user paused while loading
      if (!wantToPlayRef.current) {
        setIsLoading(false)
        return
      }

      if (audioRef.current) {
        audioRef.current.pause()
        playingChapterRef.current = targetChapter
        playingSentenceRef.current = targetSentence
        audioRef.current.src = url
        await audioRef.current.play()
      }

      continuePrefetching()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to play audio')
      setIsPlaying(false)
    } finally {
      setIsLoading(false)
    }
  }, [currentChapter, currentSentence, fetchAudio, continuePrefetching])

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()

      audioRef.current.onended = () => {
        const chapterIdx = playingChapterRef.current
        const sentenceIdx = playingSentenceRef.current
        const allChapters = chaptersRef.current
        const progressChange = onProgressChangeRef.current

        if (chapterIdx === null || sentenceIdx === null) return

        const chapter = allChapters[chapterIdx]
        if (!chapter) return

        // Advance to next sentence
        const nextSentence = sentenceIdx + 1
        if (nextSentence < chapter.sentences.length) {
          progressChange(chapterIdx, nextSentence)
        } else if (chapterIdx < allChapters.length - 1) {
          progressChange(chapterIdx + 1, 0)
        } else {
          setIsPlaying(false)
        }
      }

      audioRef.current.onerror = () => {
        setError('Audio playback error')
        setIsPlaying(false)
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  useEffect(() => {
    if (isPlaying) {
      playCurrentSentence()
    }
  }, [isPlaying, currentChapter, currentSentence, playCurrentSentence])

  const togglePlay = () => {
    if (isPlaying) {
      wantToPlayRef.current = false
      audioRef.current?.pause()
      setIsPlaying(false)
    } else {
      wantToPlayRef.current = true
      setIsPlaying(true)
    }
  }

  // Space to toggle play/pause
  useHotkeys('space', togglePlay, { preventDefault: true })

  const skipBack = () => {
    if (currentSentence > 0) {
      onProgressChange(currentChapter, currentSentence - 1)
    } else if (currentChapter > 0) {
      const prevChapter = chapters[currentChapter - 1]
      onProgressChange(currentChapter - 1, prevChapter.sentences.length - 1)
    }
  }

  const skipForward = () => {
    const chapter = chapters[currentChapter]
    if (currentSentence < chapter.sentences.length - 1) {
      onProgressChange(currentChapter, currentSentence + 1)
    } else if (currentChapter < chapters.length - 1) {
      onProgressChange(currentChapter + 1, 0)
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="max-w-2xl mx-auto">
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 mb-2 text-center">
            {error}
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={skipBack}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Previous sentence"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={togglePlay}
            className="p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors relative"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading && (
              <svg className="w-6 h-6 animate-spin absolute inset-0 m-auto" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {isPlaying ? (
              <svg className={`w-6 h-6 ${isLoading ? 'opacity-30' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className={`w-6 h-6 ${isLoading ? 'opacity-30' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={skipForward}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Next sentence"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

        </div>

        <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
          Sentence {currentSentence + 1} of {totalSentences}
          {chapters.length > 1 && (
            <span className="ml-2">
              (Chapter {currentChapter + 1} of {chapters.length})
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
