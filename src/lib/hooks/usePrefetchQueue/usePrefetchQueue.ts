'use client'

import { getNextPosition as getNextPositionHelper } from '@/lib/helpers/getNextPosition/getNextPosition'
import { parseTimestampsHeader } from '@/lib/helpers/parseTimestampsHeader/parseTimestampsHeader'
import { useFetchLifecycle } from '@/lib/hooks/useFetchLifecycle/useFetchLifecycle'
import { DEFAULT_VOICE } from '@/lib/services/voice/voice.consts'
import type { ChapterInfo } from '@/lib/types/book'
import type { WordTimestamp } from '@/lib/types/wordTimestamp'
import { useCallback, useMemo, useRef } from 'react'

export type PlaybackMetrics = {
  isGenerating: boolean
  ahead: number
}

export type FetchAudioResult = {
  url: string
  timestamps: WordTimestamp[] | null
}

interface UsePrefetchQueueOptions {
  bookId: string
  voice: string
  chaptersRef: React.MutableRefObject<ChapterInfo[]>
  currentChapterRef: React.MutableRefObject<number>
  currentParagraphRef: React.MutableRefObject<number>
  onDebugUpdate?: (updater: (prev: PlaybackMetrics) => PlaybackMetrics) => void
}

const MAX_CONCURRENT_PREFETCH = 1
export const MAX_PREFETCH_AHEAD = 120
const FETCH_TIMEOUT_MS = 90_000

export const usePrefetchQueue = (options: UsePrefetchQueueOptions) => {
  const { bookId, voice, chaptersRef, currentChapterRef, currentParagraphRef, onDebugUpdate } =
    options

  const { mountedRef, abortControllerRef, inFlightRef } = useFetchLifecycle()
  const consecutiveFailuresRef = useRef(0)
  const prefetchedRef = useRef<Set<string>>(new Set())

  const getCacheKey = useCallback(
    (ch: number, para: number) => `${ch}_${para}_${voice ?? DEFAULT_VOICE}`,
    [voice],
  )

  const getTTSUrl = useCallback(
    (ch: number, para: number) =>
      `/api/tts/${bookId}/${ch}/${para}?voice=${encodeURIComponent(voice ?? DEFAULT_VOICE)}`,
    [bookId, voice],
  )

  const countAhead = useCallback(() => {
    let count = 0
    let ch = currentChapterRef.current
    let para = currentParagraphRef.current

    while (true) {
      para++
      const chapterData = chaptersRef.current[ch]
      if (!chapterData || para >= chapterData.paragraphCount) {
        ch++
        para = 0
        if (ch >= chaptersRef.current.length) break
      }
      if (prefetchedRef.current.has(getCacheKey(ch, para))) {
        count++
      } else {
        break
      }
    }
    return count
  }, [getCacheKey, chaptersRef, currentChapterRef, currentParagraphRef])

  const updateDebugMetrics = useCallback(() => {
    onDebugUpdate?.(prev => {
      const isGenerating = inFlightRef.current.size > 0
      const ahead = countAhead()
      if (prev.isGenerating === isGenerating && prev.ahead === ahead) return prev
      return { isGenerating, ahead }
    })
  }, [onDebugUpdate, countAhead])

  const getNextPosition = useCallback(
    (ch: number, para: number) => getNextPositionHelper(chaptersRef.current, ch, para),
    [chaptersRef],
  )

  const findNextToPrefetch = useCallback((): {
    ch: number
    para: number
  } | null => {
    let ch = currentChapterRef.current
    let para = currentParagraphRef.current

    while (true) {
      const next = getNextPosition(ch, para)
      if (!next) return null

      ch = next.ch
      para = next.para

      const key = getCacheKey(ch, para)
      if (!prefetchedRef.current.has(key) && !inFlightRef.current.has(key)) {
        return { ch, para }
      }
    }
  }, [getCacheKey, getNextPosition, currentChapterRef, currentParagraphRef])

  const continuePrefetching = useCallback(() => {
    if (!mountedRef.current) return
    if (inFlightRef.current.size >= MAX_CONCURRENT_PREFETCH) return
    if (consecutiveFailuresRef.current >= 3) return

    const ahead = countAhead()
    if (ahead >= MAX_PREFETCH_AHEAD) return

    const next = findNextToPrefetch()
    if (!next) return

    const { ch, para } = next
    const key = getCacheKey(ch, para)
    const url = getTTSUrl(ch, para)

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

  const clearPrefetched = useCallback(
    (ch: number, para: number) => {
      prefetchedRef.current.delete(getCacheKey(ch, para))
      updateDebugMetrics()
    },
    [getCacheKey, updateDebugMetrics],
  )

  const fetchAudio = useCallback(
    async (ch: number, para: number): Promise<FetchAudioResult | null> => {
      const chapterData = chaptersRef.current[ch]
      if (!chapterData || para >= chapterData.paragraphCount) {
        return null
      }

      const key = getCacheKey(ch, para)
      const url = getTTSUrl(ch, para)

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

        const timestamps = parseTimestampsHeader(response)
        const blob = await response.blob()
        prefetchedRef.current.add(key)
        return { url: URL.createObjectURL(blob), timestamps }
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
      clearPrefetched,
    }),
    [fetchAudio, continuePrefetching, updateDebugMetrics, resetFailures, clearPrefetched],
  )
}
