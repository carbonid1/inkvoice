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

const BUFFER_SIZE = 50 // Number of sentences to prefetch ahead
const MAX_CONCURRENT_FETCHES = 3 // Limit concurrent TTS requests
const MAX_CACHE_SIZE = 100 // Max audio blobs in memory

// Simple LRU cache using Map (preserves insertion order)
class LRUCache {
  private cache = new Map<string, string>()
  private maxSize: number

  constructor(maxSize: number) {
    this.maxSize = maxSize
  }

  get(key: string): string | undefined {
    const value = this.cache.get(key)
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key)
      this.cache.set(key, value)
    }
    return value
  }

  has(key: string): boolean {
    return this.cache.has(key)
  }

  set(key: string, value: string): void {
    // If key exists, delete to update insertion order
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }
    // Evict oldest entries if at capacity
    while (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey !== undefined) {
        const oldUrl = this.cache.get(oldestKey)
        if (oldUrl) URL.revokeObjectURL(oldUrl)
        this.cache.delete(oldestKey)
      }
    }
    this.cache.set(key, value)
  }

  get size(): number {
    return this.cache.size
  }
}

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
  const audioCache = useRef(new LRUCache(MAX_CACHE_SIZE))
  const isFetchingRef = useRef<Map<string, Promise<string | null>>>(new Map())
  const { voice } = useStore()

  // Refs to track current position for onended handler (avoids stale closure)
  const currentChapterRef = useRef(currentChapter)
  const currentSentenceRef = useRef(currentSentence)
  const chaptersRef = useRef(chapters)
  const onProgressChangeRef = useRef(onProgressChange)

  // Track what sentence is ACTUALLY playing in the audio element
  const playingChapterRef = useRef<number | null>(null)
  const playingSentenceRef = useRef<number | null>(null)
  // Ref to store prefetchAhead function (avoids circular dependencies)
  const prefetchAheadRef = useRef<((ch: number, sent: number) => void) | null>(null)
  const debugMetricsRef = useRef<DebugMetrics>({
    lastGenTimeMs: null,
    lastCacheStatus: null,
    queueDepth: 0,
    prefetchedCount: 0,
    bufferSize: BUFFER_SIZE,
    bufferFilled: 0,
  })
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

  // Cache key for a sentence
  const getCacheKey = (ch: number, sent: number) =>
    voice ? `${ch}_${sent}_${voice}` : `${ch}_${sent}`

  // Count how many of the next BUFFER_SIZE sentences are cached
  const countBufferFilled = useCallback(
    (ch: number, sent: number): number => {
      let count = 0
      let currentCh = ch
      let currentSent = sent

      for (let i = 1; i <= BUFFER_SIZE; i++) {
        currentSent++
        const chapterData = chapters[currentCh]
        if (!chapterData || currentSent >= chapterData.sentences.length) {
          currentCh++
          currentSent = 0
          if (currentCh >= chapters.length) break
        }
        if (audioCache.current.has(getCacheKey(currentCh, currentSent))) {
          count++
        }
      }
      return count
    },
    [chapters, voice]
  )

  const updateDebugMetrics = useCallback(
    (updates: Partial<DebugMetrics>) => {
      debugMetricsRef.current = { ...debugMetricsRef.current, ...updates }
      onDebugUpdate?.(debugMetricsRef.current)
    },
    [onDebugUpdate]
  )

  // Fetch audio for a single sentence
  const fetchAudio = useCallback(
    async (ch: number, sent: number, isPrefetch = false): Promise<string | null> => {
      const chapterData = chapters[ch]
      if (!chapterData || sent >= chapterData.sentences.length) {
        return null
      }

      const key = getCacheKey(ch, sent)

      // Return cached URL if available
      if (audioCache.current.has(key)) {
        if (!isPrefetch) {
          updateDebugMetrics({
            lastCacheStatus: 'HIT',
            lastGenTimeMs: null,
            bufferFilled: countBufferFilled(currentChapterRef.current, currentSentenceRef.current),
          })
        }
        return audioCache.current.get(key)!
      }

      // Return pending promise if already fetching
      if (isFetchingRef.current.has(key)) {
        return isFetchingRef.current.get(key)!
      }

      const text = chapterData.sentences[sent]
      if (!text) return null

      // Create the fetch promise and store it
      const fetchPromise = (async (): Promise<string | null> => {
        try {
          const response = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, voice }),
          })

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}))
            throw new Error(errData.error || 'Failed to generate audio')
          }

          const genTimeMs = response.headers.get('X-Generation-Time-Ms')

          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          audioCache.current.set(key, url)

          if (!isPrefetch) {
            updateDebugMetrics({
              lastCacheStatus: 'MISS',
              lastGenTimeMs: genTimeMs ? parseInt(genTimeMs, 10) : null,
            })
          }

          updateDebugMetrics({
            prefetchedCount: audioCache.current.size,
            bufferFilled: countBufferFilled(currentChapterRef.current, currentSentenceRef.current),
          })

          // Continue prefetching if this was a prefetch request
          if (isPrefetch) {
            prefetchAheadRef.current?.(currentChapterRef.current, currentSentenceRef.current)
          }

          return url
        } catch (e) {
          console.error(`Failed to fetch audio for ${key}:`, e)
          throw e
        } finally {
          isFetchingRef.current.delete(key)
          updateDebugMetrics({ queueDepth: isFetchingRef.current.size })
        }
      })()

      isFetchingRef.current.set(key, fetchPromise)
      updateDebugMetrics({ queueDepth: isFetchingRef.current.size })

      return fetchPromise
    },
    [chapters, countBufferFilled, updateDebugMetrics, voice]
  )

  const prefetchAhead = useCallback(
    async (ch: number, sent: number) => {
      const allChapters = chapters
      let currentCh = ch
      let currentSent = sent

      // Prefetch upcoming sentences, including into next chapters
      for (let i = 1; i <= BUFFER_SIZE; i++) {
        // Limit concurrent fetches
        if (isFetchingRef.current.size >= MAX_CONCURRENT_FETCHES) break

        currentSent++
        const chapterData = allChapters[currentCh]

        // Move to next chapter if needed
        if (!chapterData || currentSent >= chapterData.sentences.length) {
          currentCh++
          currentSent = 0
          if (currentCh >= allChapters.length) break
        }

        fetchAudio(currentCh, currentSent, true).catch(() => {})
      }
    },
    [chapters, fetchAudio]
  )

  // Keep ref in sync with prefetchAhead
  prefetchAheadRef.current = prefetchAhead

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

      prefetchAhead(targetChapter, targetSentence)
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
