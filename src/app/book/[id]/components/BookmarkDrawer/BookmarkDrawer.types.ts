export type BookmarkDrawerProps = {
  bookId: string
  isOpen: boolean
  onClose: () => void
  onNavigate: (chapter: number, sentence: number) => void
  chapterNames: string[]
}
