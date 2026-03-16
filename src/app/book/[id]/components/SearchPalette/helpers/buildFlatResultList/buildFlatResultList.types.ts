import type { SearchMatch } from '@/app/book/[id]/hooks/useBookSearch/useBookSearch.types'

export type FlatResultHeader = {
  type: 'header'
  chapterTitle: string
  matchCount: number
}

export type FlatResultItem = {
  type: 'result'
  match: SearchMatch
  resultIndex: number
}

export type FlatResultEntry = FlatResultHeader | FlatResultItem

export type BuildFlatResultListOptions = {
  showHeaders?: boolean
}
