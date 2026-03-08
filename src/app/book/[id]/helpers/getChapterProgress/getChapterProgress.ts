type ChapterProgressInput = {
  currentChapter: number
  currentSentence: number
  sentencesPerChapter: number[]
  chapterPositions: Record<number, number>
}

export const getChapterProgress = ({
  currentChapter,
  currentSentence,
  sentencesPerChapter,
  chapterPositions,
}: ChapterProgressInput): Record<number, number> => {
  const progress: Record<number, number> = {}

  for (let i = 0; i < sentencesPerChapter.length; i++) {
    const total = sentencesPerChapter[i] ?? 0
    if (total <= 0) {
      progress[i] = 0
      continue
    }

    const position = i === currentChapter ? currentSentence : (chapterPositions[i] ?? 0)
    const lastSentenceIndex = total - 1
    progress[i] = Math.min(1, lastSentenceIndex === 0 ? 0 : position / lastSentenceIndex)
  }

  return progress
}
