'use client'

import type { WordTimestamp } from '@/lib/types/wordTimestamp'
import type { RefObject } from 'react'
import { useEffect, useRef } from 'react'
import { buildWordRanges } from './helpers/buildWordRanges/buildWordRanges'
import { findActiveWord } from './helpers/findActiveWord/findActiveWord'

type UseWordHighlightOptions = {
  audioRef: RefObject<HTMLAudioElement | null>
  timestamps: WordTimestamp[] | null
  paragraphRef: RefObject<HTMLSpanElement | null>
  isPlaying: boolean
}

const HIGHLIGHT_ACTIVE_WORD = 'active-word'

const supportsHighlightAPI = (): boolean => typeof CSS !== 'undefined' && 'highlights' in CSS

export const useWordHighlight = ({
  audioRef,
  timestamps,
  paragraphRef,
  isPlaying,
}: UseWordHighlightOptions): void => {
  const wordRangesRef = useRef<(Range | null)[]>([])
  const activeIndexRef = useRef(-1)
  const rafIdRef = useRef(0)
  const timestampsRef = useRef<WordTimestamp[] | null>(null)

  useEffect(() => {
    timestampsRef.current = timestamps
  })

  useEffect(() => {
    if (!supportsHighlightAPI()) return

    if (!isPlaying || !timestamps || timestamps.length === 0) {
      if (!timestamps) {
        CSS.highlights.delete(HIGHLIGHT_ACTIVE_WORD)
        wordRangesRef.current = []
        activeIndexRef.current = -1
      }
      return
    }

    const rebuildRanges = () => {
      const element = paragraphRef.current
      const ts = timestampsRef.current
      if (!element || !ts || ts.length === 0) {
        wordRangesRef.current = []
        return
      }
      wordRangesRef.current = buildWordRanges(element, ts)
    }

    const reapplyHighlight = () => {
      const idx = activeIndexRef.current
      if (idx < 0) return
      const range = wordRangesRef.current[idx]
      if (range) {
        CSS.highlights.set(HIGHLIGHT_ACTIVE_WORD, new Highlight(range))
      }
    }

    // Build initial ranges
    rebuildRanges()

    // MutationObserver: when React re-renders the span (className change,
    // dangerouslySetInnerHTML re-apply, parent re-render), rebuild ranges
    // and re-apply the current highlight immediately.
    const observer = new MutationObserver(() => {
      rebuildRanges()
      reapplyHighlight()
    })

    const element = paragraphRef.current
    if (element) {
      observer.observe(element, {
        childList: true,
        subtree: true,
      })
    }

    const tick = () => {
      const audio = audioRef.current
      if (!audio || audio.paused) {
        rafIdRef.current = requestAnimationFrame(tick)
        return
      }

      const currentTime = audio.currentTime
      const ts = timestampsRef.current
      if (!ts) {
        rafIdRef.current = requestAnimationFrame(tick)
        return
      }

      const newIndex = findActiveWord(currentTime, ts)

      if (newIndex !== activeIndexRef.current && newIndex >= 0) {
        activeIndexRef.current = newIndex
        const range = wordRangesRef.current[newIndex]
        if (range) {
          CSS.highlights.set(HIGHLIGHT_ACTIVE_WORD, new Highlight(range))
        }
      }

      rafIdRef.current = requestAnimationFrame(tick)
    }

    // Set initial word
    const audio = audioRef.current
    if (audio) {
      const initialIndex = findActiveWord(audio.currentTime, timestamps)
      if (initialIndex >= 0) {
        activeIndexRef.current = initialIndex
        reapplyHighlight()
      }
    }

    rafIdRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafIdRef.current)
      observer.disconnect()
      // Don't clear highlight here — preserves last word on pause.
      // Highlight is cleared when timestamps become null (line 41).
    }
  }, [audioRef, timestamps, paragraphRef, isPlaying])
}
