export type ChapterEndModalProps = {
  isOpen: boolean
  completedChapterTitle: string
  nextChapterTitle: string
  chaptersCompleted: number
  totalChapters: number
  onContinue: () => void
  onDismiss: () => void
}
