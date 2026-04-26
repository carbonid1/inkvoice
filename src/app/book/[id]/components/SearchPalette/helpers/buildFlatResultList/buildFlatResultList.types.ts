import type { SearchMatch } from '@/app/book/[id]/hooks/useBookSearch/useBookSearch.types'

export interface FlatResultHeader {
  type: 'header'
  chapterTitle: string
  matchCount: number
}

export interface FlatResultItem {
  type: 'result'
  match: SearchMatch
  resultIndex: number
}

export type FlatResultEntry = FlatResultHeader | FlatResultItem

export interface BuildFlatResultListOptions {
  showHeaders?: boolean
}
