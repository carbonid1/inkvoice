export type ChapterEndModalProps = {
  isOpen: boolean
  completedChapterTitle: string
  nextChapterTitle: string
  nextChapterPageCount: number | null
  chaptersCompleted: number
  totalChapters: number
  onContinue: () => void
  onDismiss: () => void
}
