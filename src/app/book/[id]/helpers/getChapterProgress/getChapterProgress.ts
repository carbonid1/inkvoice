interface ChapterProgressInput {
  currentChapter: number
  currentParagraph: number
  paragraphsPerChapter: number[]
  chapterPositions: Record<number, number>
}

export const getChapterProgress = ({
  currentChapter,
  currentParagraph,
  paragraphsPerChapter,
  chapterPositions,
}: ChapterProgressInput): Record<number, number> => {
  const progress: Record<number, number> = {}

  for (let i = 0; i < paragraphsPerChapter.length; i++) {
    const total = paragraphsPerChapter[i] ?? 0

    if (total <= 0) {
      progress[i] = 0
      continue
    }

    const position = i === currentChapter ? currentParagraph : (chapterPositions[i] ?? 0)
    const lastParagraphIndex = total - 1

    progress[i] = Math.min(1, lastParagraphIndex === 0 ? 0 : position / lastParagraphIndex)
  }

  return progress
}
