import type { ChapterInfo } from '@/lib/types/book'

export const getNextPosition = (
  chapters: ChapterInfo[],
  ch: number,
  sent: number,
): { ch: number; sent: number } | null => {
  const nextSent = sent + 1
  const chapterData = chapters[ch]

  if (chapterData && nextSent < chapterData.sentenceCount) {
    return { ch, sent: nextSent }
  }

  const nextCh = ch + 1
  if (nextCh < chapters.length) {
    return { ch: nextCh, sent: 0 }
  }

  return null
}
