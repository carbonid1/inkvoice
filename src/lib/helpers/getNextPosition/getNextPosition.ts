import type { ParsedChapter } from '@/lib/types/book'

export const getNextPosition = (
  chapters: ParsedChapter[],
  ch: number,
  sent: number
): { ch: number; sent: number } | null => {
  const nextSent = sent + 1
  const chapterData = chapters[ch]

  if (chapterData && nextSent < chapterData.sentences.length) {
    return { ch, sent: nextSent }
  }

  const nextCh = ch + 1
  if (nextCh < chapters.length) {
    return { ch: nextCh, sent: 0 }
  }

  return null
}
