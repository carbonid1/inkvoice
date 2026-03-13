import { WORDS_PER_PAGE } from '../computePagePosition/computePagePosition'

type ChapterPagePositionInput = {
  paragraph: number
  paragraphCount: number
  wordCount: number
}

type ChapterPagePosition = {
  currentPage: number
  totalPages: number
}

export const computeChapterPagePosition = ({
  paragraph,
  paragraphCount,
  wordCount,
}: ChapterPagePositionInput): ChapterPagePosition | null => {
  if (paragraphCount === 0 || wordCount === 0) return null

  const totalPages = Math.ceil(wordCount / WORDS_PER_PAGE)
  const paragraphFraction = paragraph / paragraphCount
  const wordsRead = paragraphFraction * wordCount
  const currentPage = Math.min(Math.floor(wordsRead / WORDS_PER_PAGE) + 1, totalPages)

  return { currentPage, totalPages }
}
