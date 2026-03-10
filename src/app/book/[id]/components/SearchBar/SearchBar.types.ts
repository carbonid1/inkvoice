export type SearchBarProps = {
  query: string
  totalMatches: number
  currentMatchIndex: number
  loading: boolean
  onQueryChange: (query: string) => void
  onNext: () => void
  onPrevious: () => void
  onClose: () => void
}
