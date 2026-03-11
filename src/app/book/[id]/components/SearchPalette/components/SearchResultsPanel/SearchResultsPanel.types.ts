import type { SearchMatch } from '@/app/book/[id]/hooks/useBookSearch/useBookSearch.types'

export type SearchResultsPanelProps = {
  results: SearchMatch[]
  query: string
  highlightedIndex: number
  truncated: boolean
  onSelect: (resultIndex: number) => void
  onHighlight: (resultIndex: number) => void
}
