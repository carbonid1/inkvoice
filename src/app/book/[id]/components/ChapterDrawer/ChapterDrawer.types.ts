import type { ChapterInfo, TocNode } from '@/lib/types/book'

export type ChapterDrawerProps = {
  isOpen: boolean
  onClose: () => void
  onNavigate: (chapter: number) => void
  chapters: ChapterInfo[]
  tocTree?: TocNode[]
  currentChapter: number
}
