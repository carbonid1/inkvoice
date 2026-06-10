import type { ChapterInfo } from '@/lib/types/book'

interface BookPosition {
  chapter: number
  paragraph: number
}

const globalParagraphIndex = (chapters: ChapterInfo[], position: BookPosition): number =>
  chapters
    .slice(0, position.chapter)
    .reduce((total, chapter) => total + chapter.paragraphCount, position.paragraph)

/** Paragraph count from one book position to another; negative when `to` is behind `from`. */
export const countParagraphsBetween = (
  chapters: ChapterInfo[],
  from: BookPosition,
  to: BookPosition,
): number => globalParagraphIndex(chapters, to) - globalParagraphIndex(chapters, from)
