import type { SearchMatch } from '@/app/book/[id]/hooks/useBookSearch/useBookSearch.types'

export type SearchPaletteProps = {
  query: string
  results: SearchMatch[]
  highlightedIndex: number
  loading: boolean
  truncated: boolean
  onQueryChange: (query: string) => void
  onHighlightNext: () => void
  onHighlightPrevious: () => void
  onHighlight: (index: number) => void
  onSelect: (chapter: number, paragraph: number) => void
  onClose: () => void
}
