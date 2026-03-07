'use client'

import { getNextPosition as getNextPositionHelper } from '@/lib/helpers/getNextPosition/getNextPosition'
import { useFetchLifecycle } from '@/lib/hooks/useFetchLifecycle/useFetchLifecycle'
import { DEFAULT_VOICE } from '@/lib/services/voice/voice.consts'
import type { ChapterInfo } from '@/lib/types/book'
import type { PlaybackMetrics } from '@/lib/types/debug'
import { useCallback, useMemo, useRef } from 'react'

interface UsePrefetchQueueOptions {
  bookId: string
  voice: string
  chaptersRef: React.MutableRefObject<ChapterInfo[]>
  currentChapterRef: React.MutableRefObject<number>
  currentSentenceRef: React.MutableRefObject<number>
  onDebugUpdate?: (updater: (prev: PlaybackMetrics) => PlaybackMetrics) => void
  prefetchEnabled: boolean
}

const MAX_CONCURRENT_PREFETCH = 1
const MAX_PREFETCH_AHEAD = 120
const FETCH_TIMEOUT_MS = 90_000

export const usePrefetchQueue = (options: UsePrefetchQueueOptions) => {
  const {
    bookId,
    voice,
    chaptersRef,
    currentChapterRef,
    currentSentenceRef,
    onDebugUpdate,
    prefetchEnabled,
  } = options

  const { mountedRef, abortControllerRef, inFlightRef } = useFetchLifecycle()
  const prefetchEnabledRef = useRef(prefetchEnabled)
  prefetchEnabledRef.current = prefetchEnabled
  const consecutiveFailuresRef = useRef(0)
  const prefetchedRef = useRef<Set<string>>(new Set())
  const cacheStatsRef = useRef<{ usedMB: number; maxMB: number }>({
    usedMB: 0,
    maxMB: 800,
  })

  const getCacheKey = useCallback(
    (ch: number, sent: number) => `${ch}_${sent}_${voice ?? DEFAULT_VOICE}`,
    [voice],
  )

  const getTTSUrl = useCallback(
    (ch: number, sent: number) =>
      `/api/tts/${bookId}/${ch}/${sent}?voice=${encodeURIComponent(voice ?? DEFAULT_VOICE)}`,
    [bookId, voice],
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

    const ahead = countAhead()
    if (!prefetchEnabledRef.current && ahead >= 5) return
    if (ahead >= MAX_PREFETCH_AHEAD) return

    const next = findNextToPrefetch()
    if (!next) return

    const { ch, sent } = next
    const key = getCacheKey(ch, sent)
    const url = getTTSUrl(ch, sent)

    inFlightRef.current.add(key)
    updateDebugMetrics()

    fetch(url, {
      signal: AbortSignal.any([
        abortControllerRef.current.signal,
        AbortSignal.timeout(FETCH_TIMEOUT_MS),
      ]),
      cache: 'no-store',
    })
      .then(async response => {
        // Consume body to free the HTTP connection
        await response.arrayBuffer()

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
        const response = await fetch(url, {
          signal: AbortSignal.any([
            abortControllerRef.current.signal,
            AbortSignal.timeout(FETCH_TIMEOUT_MS),
          ]),
          cache: 'no-store',
        })
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
