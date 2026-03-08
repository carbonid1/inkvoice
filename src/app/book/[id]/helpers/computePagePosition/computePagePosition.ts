export const WORDS_PER_PAGE = 350

type PagePositionInput = {
  chapter: number
  sentence: number
  wordsPerChapter: number[]
  sentencesPerChapter: number[]
}

type PagePosition = {
  currentPage: number
  totalPages: number
}

export const computePagePosition = (input: PagePositionInput): PagePosition | null => {
  const { chapter, sentence, wordsPerChapter, sentencesPerChapter } = input

  if (wordsPerChapter.length === 0 || sentencesPerChapter.length === 0) return null

  const totalWords = wordsPerChapter.reduce((a, b) => a + b, 0)
  if (totalWords === 0) return null

  const totalPages = Math.ceil(totalWords / WORDS_PER_PAGE)

  const wordsInPriorChapters = wordsPerChapter.slice(0, chapter).reduce((a, b) => a + b, 0)
  const currentChapterSentences = sentencesPerChapter[chapter] ?? 0
  const sentenceFraction = currentChapterSentences > 0 ? sentence / currentChapterSentences : 0
  const currentChapterWords = wordsPerChapter[chapter] ?? 0
  const wordsRead = wordsInPriorChapters + sentenceFraction * currentChapterWords

  const currentPage = Math.min(Math.floor(wordsRead / WORDS_PER_PAGE) + 1, totalPages)

  return { currentPage, totalPages }
}
