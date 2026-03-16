import type {
  SearchMatch,
  SearchScope,
} from '@/app/book/[id]/hooks/useBookSearch/useBookSearch.types'

export type SearchResultsPanelProps = {
  results: SearchMatch[]
  query: string
  highlightedIndex: number
  truncated: boolean
  scope: SearchScope
  onSelect: (resultIndex: number) => void
  onHighlight: (resultIndex: number) => void
}
