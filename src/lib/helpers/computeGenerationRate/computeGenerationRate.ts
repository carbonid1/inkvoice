import type { ProgressSample } from '@/store/usePregenStore'

const MIN_SPAN_MS = 5_000

/**
 * Paragraphs generated per second across the sample buffer, or null when the
 * buffer is too thin to trust (under two samples, span below five seconds, or
 * no forward progress).
 */
export const computeGenerationRate = (samples: ProgressSample[]): number | null => {
  const first = samples.at(0)
  const last = samples.at(-1)

  if (!first || !last) return null

  const spanMs = last.at - first.at
  const paragraphs = last.completedParagraphs - first.completedParagraphs

  if (spanMs < MIN_SPAN_MS || paragraphs <= 0) return null
  return paragraphs / (spanMs / 1000)
}
