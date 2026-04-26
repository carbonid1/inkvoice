interface ChapterProgressInput {
  paragraph: number
  paragraphsInChapter: number
}

export const computeChapterProgressPercent = ({
  paragraph,
  paragraphsInChapter,
}: ChapterProgressInput): number | null => {
  if (paragraphsInChapter === 0) return null
  return (paragraph / paragraphsInChapter) * 100
}
