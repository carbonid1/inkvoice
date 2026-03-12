'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useMemo, useRef } from 'react'
import { buildFlatResultList } from '../../helpers/buildFlatResultList/buildFlatResultList'
import type { FlatResultItem } from '../../helpers/buildFlatResultList/buildFlatResultList.types'
import { highlightSnippet } from '../../helpers/highlightSnippet/highlightSnippet'
import type { SearchResultsPanelProps } from './SearchResultsPanel.types'

const HEADER_HEIGHT = 32
const RESULT_HEIGHT = 52

export const SearchResultsPanel = ({
  results,
  query,
  highlightedIndex,
  truncated,
  onSelect,
  onHighlight,
}: SearchResultsPanelProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const flatList = useMemo(() => buildFlatResultList(results), [results])

  // Map highlightedIndex (result index) → flat list index for scroll targeting
  const highlightedFlatIndex = useMemo(() => {
    return flatList.findIndex(
      entry => entry.type === 'result' && entry.resultIndex === highlightedIndex,
    )
  }, [flatList, highlightedIndex])

  const virtualizer = useVirtualizer({
    count: flatList.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: index => (flatList[index]?.type === 'header' ? HEADER_HEIGHT : RESULT_HEIGHT),
    overscan: 10,
  })

  // Auto-scroll to highlighted item when it changes via keyboard
  useEffect(() => {
    if (highlightedFlatIndex >= 0) {
      virtualizer.scrollToIndex(highlightedFlatIndex, { align: 'auto' })
    }
  }, [highlightedFlatIndex, virtualizer])

  return (
    <div>
      <div ref={scrollContainerRef} className="max-h-[60vh] overflow-y-auto">
        <div className="relative" style={{ height: `${virtualizer.getTotalSize()}px` }}>
          {virtualizer.getVirtualItems().map(virtualRow => {
            const entry = flatList[virtualRow.index]!

            if (entry.type === 'header') {
              return (
                <div
                  key={`header-${virtualRow.index}`}
                  className="absolute top-0 left-0 w-full flex items-center gap-2 px-3 pt-3 pb-1"
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <span className="text-xs font-medium text-muted-foreground uppercase truncate">
                    {entry.chapterTitle}
                  </span>
                  <span className="text-[10px] text-muted-foreground tabular-nums flex-shrink-0">
                    {entry.matchCount}
                  </span>
                </div>
              )
            }

            const resultEntry = entry as FlatResultItem
            const isHighlighted = resultEntry.resultIndex === highlightedIndex

            return (
              <div
                key={`result-${virtualRow.index}`}
                className={`absolute top-0 left-0 w-full px-3 py-2 cursor-pointer transition-colors ${
                  isHighlighted ? 'bg-blue-50 dark:bg-white/[0.08]' : ''
                }`}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                onClick={() => onSelect(resultEntry.resultIndex)}
                onMouseEnter={() => onHighlight(resultEntry.resultIndex)}
              >
                <p className="text-sm text-foreground line-clamp-2 leading-snug">
                  {highlightSnippet(
                    resultEntry.match.textSnippet,
                    query,
                    resultEntry.match.matchPositions,
                  )}
                </p>
              </div>
            )
          })}
        </div>
      </div>
      {truncated && (
        <div className="text-xs text-muted-foreground text-center py-2 border-t border-border">
          Results limited to 500 matches
        </div>
      )}
    </div>
  )
}
