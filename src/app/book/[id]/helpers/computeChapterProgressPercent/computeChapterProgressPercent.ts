type ChapterProgressInput = {
  sentence: number
  sentencesInChapter: number
}

export const computeChapterProgressPercent = ({
  sentence,
  sentencesInChapter,
}: ChapterProgressInput): number | null => {
  if (sentencesInChapter === 0) return null
  return (sentence / sentencesInChapter) * 100
}
