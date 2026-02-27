export type UseBookmarkToggleArgs = {
  bookId: string
  chapter: number
  sentence: number
  preview?: string
}

export type UseBookmarkToggleReturn = {
  isBookmarked: boolean
  toggle: () => void
}
