'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { computeGenerationRate } from '@/lib/helpers/computeGenerationRate/computeGenerationRate'
import { formatDuration } from '@/lib/helpers/formatDuration/formatDuration'
import { PREGEN_JOB_STATUS } from '@/lib/services/pregenQueue/pregenQueue.types'
import { generateAudioFromHere } from '@/lib/services/pregeneration/helpers/generateAudioFromHere/generateAudioFromHere'
import type { ChapterInfo } from '@/lib/types/book'
import { type PendingGenerationRequest, usePregenStore } from '@/store/usePregenStore'
import type { AudioGenerationStatusProps } from '../../components/player/AudioGenerationStatus'
import { countParagraphsBetween } from '../../helpers/countParagraphsBetween/countParagraphsBetween'

interface UseAudioGenerationStatusParams {
  bookId: string
  chapters: ChapterInfo[]
  currentChapter: number
  currentParagraph: number
  /** From useAudioAvailability; null while availability is unknown. */
  missingAudioParagraphs: Set<number> | null
  /** Fired once audio for the requested position lands — the caller starts playback. */
  onAudioReady: () => void
}

// Identity compare: a failure must not clear a newer request made after it.
const clearRequestIfCurrent = (requested: PendingGenerationRequest): void => {
  const { pendingGenerationRequest, setPendingGenerationRequest } = usePregenStore.getState()

  if (pendingGenerationRequest === requested) setPendingGenerationRequest(null)
}

/**
 * Drives the player bar's missing-audio affordance: explains why the current
 * paragraph has no audio (with a live ETA while generation runs behind the
 * reader) and carries the generate-from-here action. After that action the
 * wait turns into autoplay — onAudioReady fires when the paragraph's audio
 * arrives, unless the reader has moved away in the meantime. Returns null
 * whenever the current paragraph has audio (or availability is unknown).
 */
export const useAudioGenerationStatus = ({
  bookId,
  chapters,
  currentChapter,
  currentParagraph,
  missingAudioParagraphs,
  onAudioReady,
}: UseAudioGenerationStatusParams): AudioGenerationStatusProps | null => {
  const pendingRequest = usePregenStore(s => s.pendingGenerationRequest)
  const setPendingGenerationRequest = usePregenStore(s => s.setPendingGenerationRequest)
  const job = usePregenStore(s => s.jobs[bookId])
  const progressSamples = usePregenStore(s => s.progressSamples[bookId])
  const rate = useMemo(
    () => (progressSamples ? computeGenerationRate(progressSamples) : null),
    [progressSamples],
  )

  const currentParagraphMissingAudio = missingAudioParagraphs?.has(currentParagraph) ?? false
  const positionIsPending =
    pendingRequest?.bookId === bookId &&
    pendingRequest?.chapter === currentChapter &&
    pendingRequest?.paragraph === currentParagraph

  // The request lives until the reader moves away (cancelled) or its audio
  // lands (consumed — playback starts via onAudioReady).
  useEffect(() => {
    if (!pendingRequest) return

    if (
      pendingRequest.bookId !== bookId ||
      pendingRequest.chapter !== currentChapter ||
      pendingRequest.paragraph !== currentParagraph
    ) {
      setPendingGenerationRequest(null)
      return
    }
    if (missingAudioParagraphs && !missingAudioParagraphs.has(currentParagraph)) {
      setPendingGenerationRequest(null)
      onAudioReady()
    }
  }, [
    pendingRequest,
    bookId,
    currentChapter,
    currentParagraph,
    missingAudioParagraphs,
    onAudioReady,
    setPendingGenerationRequest,
  ])

  const generateFromHere = useCallback(() => {
    const requested: PendingGenerationRequest = {
      bookId,
      chapter: currentChapter,
      paragraph: currentParagraph,
    }

    setPendingGenerationRequest(requested)
    generateAudioFromHere(bookId, requested.chapter, requested.paragraph)
      .then(result => {
        if (result) return
        clearRequestIfCurrent(requested)
      })
      .catch(error => {
        console.error('Failed to point audio generation at the current paragraph:', error)
        clearRequestIfCurrent(requested)
      })
  }, [bookId, currentChapter, currentParagraph, setPendingGenerationRequest])

  return useMemo<AudioGenerationStatusProps | null>(() => {
    if (!currentParagraphMissingAudio) return null

    if (positionIsPending) {
      return {
        message: "Generating audio for this paragraph — playback will start when it's ready",
        pending: true,
      }
    }

    const actionable = { onGenerateFromHere: generateFromHere }

    if (job?.status === PREGEN_JOB_STATUS.PAUSED) {
      return { ...actionable, message: 'Audio generation for this book is paused' }
    }

    const generationApproaching =
      job?.status === PREGEN_JOB_STATUS.IN_PROGRESS || job?.status === PREGEN_JOB_STATUS.QUEUED
    const paragraphsAhead = generationApproaching
      ? countParagraphsBetween(
          chapters,
          { chapter: job.currentChapter, paragraph: job.currentParagraph },
          { chapter: currentChapter, paragraph: currentParagraph },
        )
      : 0

    if (generationApproaching && paragraphsAhead > 0) {
      if (job.status === PREGEN_JOB_STATUS.QUEUED) {
        return { ...actionable, message: 'Audio generation is queued for this book' }
      }

      const etaLabel = rate ? formatDuration((paragraphsAhead / rate) * 1000) : null

      return {
        ...actionable,
        message: etaLabel
          ? `Audio is generating — about ${etaLabel} away`
          : 'Audio is generating — it has not reached this paragraph yet',
      }
    }

    return { ...actionable, message: 'No audio has been generated for this paragraph yet' }
  }, [
    currentParagraphMissingAudio,
    positionIsPending,
    generateFromHere,
    job,
    chapters,
    currentChapter,
    currentParagraph,
    rate,
  ])
}
