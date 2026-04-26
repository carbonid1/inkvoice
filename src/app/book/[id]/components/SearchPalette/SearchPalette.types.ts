import type {
  SearchMatch,
  SearchScope,
} from '@/app/book/[id]/hooks/useBookSearch/useBookSearch.types'

export interface SearchPaletteProps {
  query: string
  results: SearchMatch[]
  highlightedIndex: number
  loading: boolean
  truncated: boolean
  scope: SearchScope
  onQueryChange: (query: string) => void
  onScopeChange: (scope: SearchScope) => void
  onHighlightNext: () => void
  onHighlightPrevious: () => void
  onHighlight: (index: number) => void
  onSelect: (chapter: number, paragraph: number) => void
  onClose: () => void
}
