export type Progress = {
  chapter: number
  sentence: number
  totalChapters?: number
  sentencesPerChapter?: number[]
  wordsPerChapter?: number[]
  lastReadAt?: number
  chapterPositions?: Record<number, number>
}
