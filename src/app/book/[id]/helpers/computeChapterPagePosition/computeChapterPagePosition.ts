import { WORDS_PER_PAGE } from '../computePagePosition/computePagePosition'

type ChapterPagePositionInput = {
  sentence: number
  sentenceCount: number
  wordCount: number
}

type ChapterPagePosition = {
  currentPage: number
  totalPages: number
}

export const computeChapterPagePosition = ({
  sentence,
  sentenceCount,
  wordCount,
}: ChapterPagePositionInput): ChapterPagePosition | null => {
  if (sentenceCount === 0 || wordCount === 0) return null

  const totalPages = Math.ceil(wordCount / WORDS_PER_PAGE)
  const sentenceFraction = sentence / sentenceCount
  const wordsRead = sentenceFraction * wordCount
  const currentPage = Math.min(Math.floor(wordsRead / WORDS_PER_PAGE) + 1, totalPages)

  return { currentPage, totalPages }
}
