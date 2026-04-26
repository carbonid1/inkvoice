import { WORDS_PER_PAGE } from '../computePagePosition/computePagePosition'

export const computeStartPages = (wordsPerChapter: number[]): number[] => {
  const acc = { words: 0 }

  return wordsPerChapter.map(words => {
    const startPage = Math.floor(acc.words / WORDS_PER_PAGE) + 1

    acc.words += words
    return startPage
  })
}
