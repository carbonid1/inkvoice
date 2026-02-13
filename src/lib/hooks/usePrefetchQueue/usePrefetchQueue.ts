'use client'

import type { DebugMetrics } from '@/components/DebugPanel'
import { getNextPosition as getNextPositionHelper } from '@/lib/helpers/getNextPosition/getNextPosition'
import type { ChapterInfo } from '@/lib/types/book'
import { useCallback, useEffect, useMemo, useRef } from 'react'

interface UsePrefetchQueueOptions {
  bookId: string
  voice: string
  pronunciationVersion: number
  chaptersRef: React.MutableRefObject<ChapterInfo[]>
  currentChapterRef: React.MutableRefObject<number>
  currentSentenceRef: React.MutableRefObject<number>
  onDebugUpdate?: (updater: (prev: DebugMetrics) => DebugMetrics) => void
}

const MAX_CONCURRENT_PREFETCH = 1

export const usePrefetchQueue = (options: UsePrefetchQueueOptions) => {
  const {
    bookId,
    voice,
    pronunciationVersion,
    chaptersRef,
    currentChapterRef,
    currentSentenceRef,
    onDebugUpdate,
  } = options

  // Track in-flight fetches
  const inFlightRef = useRef<Set<string>>(new Set())
  // Track consecutive prefetch failures
  const consecutiveFailuresRef = useRef(0)
  // Track what's been prefetched
  const prefetchedRef = useRef<Set<string>>(new Set())
  // Track cache stats
  const cacheStatsRef = useRef<{ usedMB: number; maxMB: number }>({
    usedMB: 0,
    maxMB: 800,
  })
  // Track abort controller for canceling fetches
  const abortControllerRef = useRef<AbortController>(new AbortController())
  // Track if component is mounted
  const mountedRef = useRef(true)

  const getCacheKey = useCallback(
    (ch: number, sent: number) => `${ch}_${sent}_${voice ?? 'narrator'}_pv${pronunciationVersion}`,
    [voice, pronunciationVersion],
  )

  const getTTSUrl = useCallback(
    (ch: number, sent: number) =>
      `/api/tts/${bookId}/${ch}/${sent}?voice=${encodeURIComponent(voice ?? 'narrator')}&pv=${pronunciationVersion}`,
    [bookId, voice, pronunciationVersion],
  )

  const countAhead = useCallback(() => {
    let count = 0
    let ch = currentChapterRef.current
    let sent = currentSentenceRef.current

    while (true) {
      sent++
      const chapterData = chaptersRef.current[ch]
      if (!chapterData || sent >= chapterData.sentenceCount) {
        ch++
        sent = 0
        if (ch >= chaptersRef.current.length) break
      }
      if (prefetchedRef.current.has(getCacheKey(ch, sent))) {
        count++
      } else {
        break
      }
    }
    return count
  }, [getCacheKey, chaptersRef, currentChapterRef, currentSentenceRef])

  const updateDebugMetrics = useCallback(() => {
    onDebugUpdate?.(prev => ({
      ...prev,
      isGenerating: inFlightRef.current.size > 0,
      ahead: countAhead(),
      cacheUsedMB: cacheStatsRef.current.usedMB,
      cacheMaxMB: cacheStatsRef.current.maxMB,
    }))
  }, [onDebugUpdate, countAhead])

  const getNextPosition = useCallback(
    (ch: number, sent: number) => getNextPositionHelper(chaptersRef.current, ch, sent),
    [chaptersRef],
  )

  const findNextToPrefetch = useCallback((): {
    ch: number
    sent: number
  } | null => {
    let ch = currentChapterRef.current
    let sent = currentSentenceRef.current

    while (true) {
      const next = getNextPosition(ch, sent)
      if (!next) return null

      ch = next.ch
      sent = next.sent

      const key = getCacheKey(ch, sent)
      if (!prefetchedRef.current.has(key) && !inFlightRef.current.has(key)) {
        return { ch, sent }
      }
    }
  }, [getCacheKey, getNextPosition, currentChapterRef, currentSentenceRef])

  const continuePrefetching = useCallback(() => {
    if (!mountedRef.current) return
    if (inFlightRef.current.size >= MAX_CONCURRENT_PREFETCH) return
    if (consecutiveFailuresRef.current >= 3) return

    const next = findNextToPrefetch()
    if (!next) return

    const { ch, sent } = next
    const key = getCacheKey(ch, sent)
    const url = getTTSUrl(ch, sent)

    inFlightRef.current.add(key)
    updateDebugMetrics()

    fetch(url, { signal: abortControllerRef.current.signal, cache: 'no-store' })
      .then(response => {
        if (!response.ok) {
          consecutiveFailuresRef.current++
          return
        }
        consecutiveFailuresRef.current = 0
        prefetchedRef.current.add(key)
        const usedBytes = response.headers.get('X-Cache-Used')
        const maxBytes = response.headers.get('X-Cache-Max')
        if (usedBytes && maxBytes) {
          cacheStatsRef.current = {
            usedMB: Math.round(parseInt(usedBytes, 10) / (1024 * 1024)),
            maxMB: Math.round(parseInt(maxBytes, 10) / (1024 * 1024)),
          }
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          consecutiveFailuresRef.current++
        }
      })
      .finally(() => {
        inFlightRef.current.delete(key)
        updateDebugMetrics()
        continuePrefetching()
      })
  }, [findNextToPrefetch, getCacheKey, getTTSUrl, updateDebugMetrics])

  const resetFailures = useCallback(() => {
    consecutiveFailuresRef.current = 0
  }, [])

  // Reset on mount (handles React StrictMode double-mount), cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    abortControllerRef.current = new AbortController()
    return () => {
      mountedRef.current = false
      abortControllerRef.current.abort()
      inFlightRef.current.clear()
    }
  }, [])

  const fetchAudio = useCallback(
    async (ch: number, sent: number): Promise<string | null> => {
      const chapterData = chaptersRef.current[ch]
      if (!chapterData || sent >= chapterData.sentenceCount) {
        return null
      }

      const key = getCacheKey(ch, sent)
      const url = getTTSUrl(ch, sent)

      inFlightRef.current.add(key)
      updateDebugMetrics()

      try {
        const response = await fetch(url, { signal: abortControllerRef.current.signal, cache: 'no-store' })
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.error || 'Failed to generate audio')
        }

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
    [chaptersRef, getCacheKey, getTTSUrl, updateDebugMetrics],
  )

  return useMemo(
    () => ({
      fetchAudio,
      continuePrefetching,
      updateDebugMetrics,
      resetFailures,
      cacheStatsRef,
    }),
    [fetchAudio, continuePrefetching, updateDebugMetrics, resetFailures, cacheStatsRef],
  )
}
