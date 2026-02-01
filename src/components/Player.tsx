'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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

const BUFFER_SIZE = 5 // Number of sentences to prefetch
const MAX_CONCURRENT_FETCHES = 2 // Limit concurrent TTS requests
const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]

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
  const audioCache = useRef<Map<string, string>>(new Map())
  const isFetchingRef = useRef<Set<string>>(new Set())
  const { playbackSpeed, setPlaybackSpeed } = useStore()
  const debugMetricsRef = useRef<DebugMetrics>({
    lastGenTimeMs: null,
    lastCacheStatus: null,
    queueDepth: 0,
    prefetchedCount: 0,
  })

  const chapter = chapters[currentChapter]
  const totalSentences = chapter?.sentences.length || 0

  const getCacheKey = (ch: number, sent: number) => `${ch}_${sent}`

  const updateDebugMetrics = useCallback(
    (updates: Partial<DebugMetrics>) => {
      debugMetricsRef.current = { ...debugMetricsRef.current, ...updates }
      onDebugUpdate?.(debugMetricsRef.current)
    },
    [onDebugUpdate]
  )

  const fetchAudio = useCallback(
    async (ch: number, sent: number, isPrefetch = false): Promise<string | null> => {
      const key = getCacheKey(ch, sent)

      // Return cached URL if available
      if (audioCache.current.has(key)) {
        if (!isPrefetch) {
          updateDebugMetrics({ lastCacheStatus: 'HIT', lastGenTimeMs: null })
        }
        return audioCache.current.get(key)!
      }

      // Skip if already fetching
      if (isFetchingRef.current.has(key)) {
        return null
      }

      const chapterData = chapters[ch]
      if (!chapterData || sent >= chapterData.sentences.length) {
        return null
      }

      const text = chapterData.sentences[sent]
      if (!text) return null

      isFetchingRef.current.add(key)
      updateDebugMetrics({ queueDepth: isFetchingRef.current.size })

      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            bookId,
            chapter: ch,
            sentence: sent,
          }),
        })

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.error || 'Failed to generate audio')
        }

        const cacheStatus = response.headers.get('X-Cache') as 'HIT' | 'MISS' | null
        const genTimeMs = response.headers.get('X-Generation-Time-Ms')

        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        audioCache.current.set(key, url)

        if (!isPrefetch) {
          updateDebugMetrics({
            lastCacheStatus: cacheStatus,
            lastGenTimeMs: genTimeMs ? parseInt(genTimeMs, 10) : null,
          })
        }

        updateDebugMetrics({ prefetchedCount: audioCache.current.size })

        return url
      } catch (e) {
        console.error(`Failed to fetch audio for ${key}:`, e)
        throw e
      } finally {
        isFetchingRef.current.delete(key)
        updateDebugMetrics({ queueDepth: isFetchingRef.current.size })
      }
    },
    [bookId, chapters, updateDebugMetrics]
  )

  const prefetchAhead = useCallback(
    async (ch: number, sent: number) => {
      const chapterData = chapters[ch]
      if (!chapterData) return

      for (let i = 1; i <= BUFFER_SIZE; i++) {
        // Limit concurrent fetches to avoid overwhelming the backend
        if (isFetchingRef.current.size >= MAX_CONCURRENT_FETCHES) break

        const nextSent = sent + i
        if (nextSent < chapterData.sentences.length) {
          fetchAudio(ch, nextSent, true).catch(() => {})
        }
      }
    },
    [chapters, fetchAudio]
  )

  // Apply playback speed to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed
    }
  }, [playbackSpeed])

  const cycleSpeed = () => {
    const currentIndex = SPEED_OPTIONS.indexOf(playbackSpeed)
    const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length
    setPlaybackSpeed(SPEED_OPTIONS[nextIndex])
  }

  const playCurrentSentence = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const url = await fetchAudio(currentChapter, currentSentence)
      if (!url) {
        setIsLoading(false)
        return
      }

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = url
        await audioRef.current.play()
      }

      prefetchAhead(currentChapter, currentSentence)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to play audio')
      setIsPlaying(false)
    } finally {
      setIsLoading(false)
    }
  }, [currentChapter, currentSentence, fetchAudio, prefetchAhead])

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.playbackRate = playbackSpeed

      audioRef.current.onended = () => {
        const chapter = chapters[currentChapter]
        if (!chapter) return

        if (currentSentence < chapter.sentences.length - 1) {
          onProgressChange(currentChapter, currentSentence + 1)
        } else if (currentChapter < chapters.length - 1) {
          onProgressChange(currentChapter + 1, 0)
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
  }, [chapters, currentChapter, currentSentence, onProgressChange, playbackSpeed])

  useEffect(() => {
    if (isPlaying) {
      playCurrentSentence()
    }
  }, [isPlaying, currentChapter, currentSentence, playCurrentSentence])

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
    }
  }

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
            disabled={isLoading}
            className="p-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-full transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24">
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
            ) : isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
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

          <button
            onClick={cycleSpeed}
            className="ml-2 px-3 py-1 text-sm font-medium rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-w-[3rem]"
            title="Playback speed"
          >
            {playbackSpeed}x
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
