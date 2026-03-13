import type { ChapterInfo } from '@/lib/types/book'

export const getNextPosition = (
  chapters: ChapterInfo[],
  ch: number,
  para: number,
): { ch: number; para: number } | null => {
  const nextPara = para + 1
  const chapterData = chapters[ch]

  if (chapterData && nextPara < chapterData.paragraphCount) {
    return { ch, para: nextPara }
  }

  const nextCh = ch + 1
  if (nextCh < chapters.length) {
    return { ch: nextCh, para: 0 }
  }

  return null
}
