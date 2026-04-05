import type { Progress } from '@/store/useProgressStore'

export const computeCompletedParagraphs = (progress: Progress | undefined): number => {
  if (!progress?.paragraphsPerChapter || progress.paragraphsPerChapter.length === 0) return 0
  return (
    progress.paragraphsPerChapter.slice(0, progress.chapter).reduce((sum, n) => sum + n, 0) +
    progress.paragraph
  )
}
