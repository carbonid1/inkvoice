export type SavedPosition = {
  chapter: number
  paragraph: number
}

export type UseReturnPositionResult = {
  savedPosition: SavedPosition | null
  savePosition: (chapter: number, paragraph: number) => void
  clearPosition: () => void
  navigateBack: (onNavigate: (chapter: number, paragraph: number) => void) => void
}
