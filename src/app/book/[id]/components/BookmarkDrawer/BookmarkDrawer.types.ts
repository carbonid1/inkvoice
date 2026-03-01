import type { ChunkingMode } from '@/lib/types/book'

export type BookmarkDrawerProps = {
  bookId: string
  isOpen: boolean
  chunkingMode: ChunkingMode
  onClose: () => void
  onNavigate: (chapter: number, sentence: number) => void
  chapterNames: string[]
}
