export type UseBookmarkToggleArgs = {
  bookId: string
  chapter: number
  paragraph: number
  preview?: string
}

export type UseBookmarkToggleReturn = {
  isBookmarked: boolean
  toggle: () => void
}
