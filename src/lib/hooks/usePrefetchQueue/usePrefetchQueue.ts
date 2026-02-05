'use client'

import { useRef, useCallback } from 'react'
import type { ParsedChapter } from '@/lib/types/book'
import type { DebugMetrics } from '@/components/DebugPanel'

interface UsePrefetchQueueOptions {
  bookId: string
  voice: string
  chaptersRef: React.MutableRefObject<ParsedChapter[]>
  currentChapterRef: React.MutableRefObject<number>
  currentSentenceRef: React.MutableRefObject<number>
  onDebugUpdate?: (metrics: DebugMetrics) => void
}

const MAX_CONCURRENT_PREFETCH = 1

export const usePrefetchQueue = (options: UsePrefetchQueueOptions) => {
  const {
    bookId,
    voice,
    chaptersRef,
    currentChapterRef,
    currentSentenceRef,
    onDebugUpdate,
  } = options

  // Track in-flight fetches
  const inFlightRef = useRef<Set<string>>(new Set())
  // Track what's been prefetched
  const prefetchedRef = useRef<Set<string>>(new Set())
  // Track cache stats
  const cacheStatsRef = useRef<{ usedMB: number; maxMB: number }>({
    usedMB: 0,
    maxMB: 800,
  })

  const getCacheKey = useCallback(
    (ch: number, sent: number) => `${ch}_${sent}_${voice ?? 'narrator'}`,
    [voice]
  )

  const getTTSUrl = useCallback(
    (ch: number, sent: number) =>
      `/api/tts/${bookId}/${ch}/${sent}?voice=${encodeURIComponent(voice ?? 'narrator')}`,
    [bookId, voice]
  )

  const countAhead = useCallback(() => {
    let count = 0
    let ch = currentChapterRef.current
    let sent = currentSentenceRef.current

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
        break
      }
    }
    return count
  }, [getCacheKey, chaptersRef, currentChapterRef, currentSentenceRef])

  const updateDebugMetrics = useCallback(() => {
    onDebugUpdate?.({
      isGenerating: inFlightRef.current.size > 0,
      ahead: countAhead(),
      cacheUsedMB: cacheStatsRef.current.usedMB,
      cacheMaxMB: cacheStatsRef.current.maxMB,
    })
  }, [onDebugUpdate, countAhead])

  const getNextPosition = useCallback(
    (ch: number, sent: number): { ch: number; sent: number } | null => {
      const nextSent = sent + 1
      const chapterData = chaptersRef.current[ch]

      if (chapterData && nextSent < chapterData.sentences.length) {
        return { ch, sent: nextSent }
      }

      const nextCh = ch + 1
      if (nextCh < chaptersRef.current.length) {
        return { ch: nextCh, sent: 0 }
      }

      return null
    },
    [chaptersRef]
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
    if (inFlightRef.current.size >= MAX_CONCURRENT_PREFETCH) return

    const next = findNextToPrefetch()
    if (!next) return

    const { ch, sent } = next
    const key = getCacheKey(ch, sent)
    const url = getTTSUrl(ch, sent)

    inFlightRef.current.add(key)
    updateDebugMetrics()

    fetch(url)
      .then((response) => {
        prefetchedRef.current.add(key)
        if (response.ok) {
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
        prefetchedRef.current.add(key)
      })
      .finally(() => {
        inFlightRef.current.delete(key)
        updateDebugMetrics()
        continuePrefetching()
      })
  }, [findNextToPrefetch, getCacheKey, getTTSUrl, updateDebugMetrics])

  const fetchAudio = useCallback(
    async (ch: number, sent: number): Promise<string | null> => {
      const chapterData = chaptersRef.current[ch]
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
    [chaptersRef, getCacheKey, getTTSUrl, updateDebugMetrics]
  )

  return {
    fetchAudio,
    continuePrefetching,
    updateDebugMetrics,
    cacheStatsRef,
  }
}
