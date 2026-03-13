import type { Progress } from '@/store/useProgressStore'

export const computeProgressPercent = (progress: Progress | undefined): number | null => {
  if (!progress?.paragraphsPerChapter || progress.paragraphsPerChapter.length === 0) return null
  const totalParagraphs = progress.paragraphsPerChapter.reduce((a, b) => a + b, 0)
  if (totalParagraphs === 0) return null
  const completed =
    progress.paragraphsPerChapter.slice(0, progress.chapter).reduce((sum, n) => sum + n, 0) +
    progress.paragraph
  return (completed / totalParagraphs) * 100
}
