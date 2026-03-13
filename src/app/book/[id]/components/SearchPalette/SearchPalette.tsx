'use client'

import { Loader2, Search, X } from 'lucide-react'
import { type KeyboardEvent, useEffect, useRef } from 'react'
import { SearchResultsPanel } from './components/SearchResultsPanel/SearchResultsPanel'
import type { SearchPaletteProps } from './SearchPalette.types'

export const SearchPalette = ({
  query,
  results,
  highlightedIndex,
  loading,
  truncated,
  onQueryChange,
  onHighlightNext,
  onHighlightPrevious,
  onHighlight,
  onSelect,
  onClose,
}: SearchPaletteProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      onHighlightNext()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      onHighlightPrevious()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const match = results[highlightedIndex]
      if (match) {
        onSelect(match.chapter, match.paragraph)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  const handleSelectResult = (resultIndex: number) => {
    const match = results[resultIndex]
    if (match) {
      onSelect(match.chapter, match.paragraph)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      onClose()
    }
  }

  const showMatchCount = query.length >= 2 && !loading
  const showNoResults = showMatchCount && results.length === 0
  const hasResults = results.length > 0 && query.length >= 2

  return (
    <div className="fixed inset-0 z-50 bg-black/30" onClick={handleBackdropClick}>
      <div
        ref={panelRef}
        className="mx-auto mt-[15vh] max-w-2xl w-[calc(100%-2rem)] rounded-xl shadow-2xl border border-border bg-background overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-150"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search in book..."
            className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-gray-400"
            aria-label="Search in book"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400 flex-shrink-0" />}
          {showNoResults && <span className="text-xs text-gray-400 flex-shrink-0">No results</span>}
          {showMatchCount && results.length > 0 && (
            <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums">
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </span>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded transition-colors flex-shrink-0"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {hasResults && (
          <SearchResultsPanel
            results={results}
            query={query}
            highlightedIndex={highlightedIndex}
            truncated={truncated}
            onSelect={handleSelectResult}
            onHighlight={onHighlight}
          />
        )}
      </div>
    </div>
  )
}
