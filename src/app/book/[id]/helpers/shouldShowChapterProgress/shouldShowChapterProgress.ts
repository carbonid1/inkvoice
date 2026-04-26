const DEFAULT_THRESHOLD = 1750

interface ShouldShowInput {
  wordsInChapter: number
  threshold?: number
}

export const shouldShowChapterProgress = ({
  wordsInChapter,
  threshold = DEFAULT_THRESHOLD,
}: ShouldShowInput): boolean => {
  return wordsInChapter >= threshold
}
