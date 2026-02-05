import type { Progress } from '@/store/useStore'

export const computeProgressPercent = (progress: Progress | undefined): number | null => {
  if (!progress?.sentencesPerChapter || progress.sentencesPerChapter.length === 0) return null
  const totalSentences = progress.sentencesPerChapter.reduce((a, b) => a + b, 0)
  if (totalSentences === 0) return null
  const completed = progress.sentencesPerChapter
    .slice(0, progress.chapter)
    .reduce((sum, n) => sum + n, 0) + progress.sentence
  return (completed / totalSentences) * 100
}
