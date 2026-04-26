const WORDS_PER_MINUTE = 150
const OPUS_MB_PER_HOUR = 17
const AVG_SECONDS_PER_PARAGRAPH = 8

interface ComputePregenEstimateArgs {
  totalParagraphs: number
  totalWords: number
  cachedParagraphs: number
}

interface PregenEstimate {
  estimatedSizeBytes: number
  estimatedGenerationMinutes: number
}

export const computePregenEstimate = ({
  totalParagraphs,
  totalWords,
  cachedParagraphs,
}: ComputePregenEstimateArgs): PregenEstimate => {
  const remainingParagraphs = Math.max(0, totalParagraphs - cachedParagraphs)
  const wordsPerParagraph = totalParagraphs > 0 ? totalWords / totalParagraphs : 0
  const remainingWords = remainingParagraphs * wordsPerParagraph
  const remainingHours = remainingWords / (WORDS_PER_MINUTE * 60)
  const estimatedSizeBytes = Math.round(remainingHours * OPUS_MB_PER_HOUR * 1024 * 1024)
  const estimatedGenerationMinutes = Math.round(
    (remainingParagraphs * AVG_SECONDS_PER_PARAGRAPH) / 60,
  )

  return { estimatedSizeBytes, estimatedGenerationMinutes }
}
