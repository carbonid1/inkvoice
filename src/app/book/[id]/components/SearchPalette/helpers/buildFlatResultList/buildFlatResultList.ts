import type { SearchMatch } from '@/app/book/[id]/hooks/useBookSearch/useBookSearch.types'
import type { BuildFlatResultListOptions, FlatResultEntry } from './buildFlatResultList.types'

export const buildFlatResultList = (
  results: SearchMatch[],
  options: BuildFlatResultListOptions = {},
): FlatResultEntry[] => {
  const { showHeaders = true } = options
  const entries: FlatResultEntry[] = []
  let currentChapter: number | null = null

  for (let i = 0; i < results.length; i++) {
    const match = results[i]
    if (!match) continue

    if (match.chapter !== currentChapter) {
      if (showHeaders) {
        // Count how many consecutive matches share this chapter
        let count = 0
        for (let j = i; j < results.length && results[j]?.chapter === match.chapter; j++) {
          count++
        }

        entries.push({
          type: 'header',
          chapterTitle: match.chapterTitle,
          matchCount: count,
        })
      }

      currentChapter = match.chapter
    }

    entries.push({
      type: 'result',
      match,
      resultIndex: i,
    })
  }

  return entries
}
