'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePregenStore } from '@/store/usePregenStore'

interface UseAudioAvailabilityParams {
  bookId: string
  chapter: number
  voice: string
}

interface UseAudioAvailabilityResult {
  /** Paragraph indices with no cached audio for the current voice; null while unknown. */
  missingAudioParagraphs: Set<number> | null
}

/**
 * Tracks which paragraphs of the current chapter have no cached audio.
 * Re-queries on voice/chapter change and as the book's pregen job progresses,
 * so indicators clear live while audio is being generated.
 */
export const useAudioAvailability = ({
  bookId,
  chapter,
  voice,
}: UseAudioAvailabilityParams): UseAudioAvailabilityResult => {
  const [availability, setAvailability] = useState<{
    key: string
    missing: Set<number>
  } | null>(null)
  const job = usePregenStore(s => s.jobs[bookId])
  const jobProgress = job ? `${job.status}:${job.completedParagraphs}` : null

  useEffect(() => {
    const controller = new AbortController()

    const fetchAvailability = async () => {
      try {
        const params = new URLSearchParams({ voice })
        const response = await fetch(`/api/tts/${bookId}/${chapter}?${params}`, {
          cache: 'no-store',
          signal: controller.signal,
        })

        if (!response.ok) return
        const data: { missingParagraphs: number[] } = await response.json()

        setAvailability({
          key: `${bookId}|${chapter}|${voice}`,
          missing: new Set(data.missingParagraphs),
        })
      } catch {
        // Aborted or offline — better no indicators than wrong ones
      }
    }

    fetchAvailability()
    return () => controller.abort()
  }, [bookId, chapter, voice, jobProgress])

  // A result fetched for a different (chapter, voice) key is stale — report
  // "unknown" rather than dimming the wrong paragraphs while the fetch lands.
  const missingAudioParagraphs =
    availability?.key === `${bookId}|${chapter}|${voice}` ? availability.missing : null

  return useMemo(() => ({ missingAudioParagraphs }), [missingAudioParagraphs])
}
