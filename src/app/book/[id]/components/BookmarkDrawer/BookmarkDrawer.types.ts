export type BookmarkDrawerProps = {
  bookId: string
  isOpen: boolean
  onClose: () => void
  onNavigate: (chapter: number, paragraph: number) => void
  chapterNames: string[]
}
