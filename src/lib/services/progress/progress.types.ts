export type Progress = {
  chapter: number
  paragraph: number
  paragraphsPerChapter?: number[]
  wordsPerChapter?: number[]
  lastReadAt?: number
  chapterPositions?: Record<number, number>
}
