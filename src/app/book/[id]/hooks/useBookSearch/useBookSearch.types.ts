export type SearchScope = 'book' | 'chapter'

export type SearchMatch = {
  chapter: number
  paragraph: number
  chapterTitle: string
  textSnippet: string
  matchPositions: number[]
}

export type SearchResponse = {
  query: string
  matches: SearchMatch[]
  totalMatches: number
  truncated: boolean
}

export type UseBookSearchResult = {
  isOpen: boolean
  query: string
  results: SearchMatch[]
  highlightedIndex: number
  highlightedMatch: SearchMatch | null
  loading: boolean
  truncated: boolean
  open: () => void
  close: () => void
  setQuery: (query: string) => void
  highlightNext: () => void
  highlightPrevious: () => void
  setHighlightedIndex: (index: number) => void
  scope: SearchScope
  setScope: (scope: SearchScope) => void
}
