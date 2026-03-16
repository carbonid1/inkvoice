'use client'

import type { SearchScope } from '@/app/book/[id]/hooks/useBookSearch/useBookSearch.types'
import { useDebouncedLoading } from '@/lib/hooks/useDebouncedLoading/useDebouncedLoading'
import { Loader2, Search, X } from 'lucide-react'
import { type KeyboardEvent, useEffect, useRef } from 'react'
import { SearchResultsPanel } from './components/SearchResultsPanel/SearchResultsPanel'
import type { SearchPaletteProps } from './SearchPalette.types'

const SCOPE_OPTIONS: { value: SearchScope; label: string }[] = [
  { value: 'book', label: 'Book' },
  { value: 'chapter', label: 'Chapter' },
]

export const SearchPalette = ({
  query,
  results,
  highlightedIndex,
  loading,
  truncated,
  scope,
  onQueryChange,
  onScopeChange,
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

  const showSpinner = useDebouncedLoading(loading)
  const showMatchCount = query.length >= 2 && !loading
  const showNoResults = showMatchCount && results.length === 0
  const hasResults = results.length > 0 && query.length >= 2
  const placeholder = scope === 'book' ? 'Search in book...' : 'Search in chapter...'

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
            placeholder={placeholder}
            className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-gray-400"
            aria-label={placeholder}
          />
          <div className="flex rounded-md bg-gray-50 dark:bg-white/[0.06] p-0.5 flex-shrink-0">
            {SCOPE_OPTIONS.map(option => (
              <button
                key={option.value}
                className={`text-xs px-2 py-0.5 rounded transition-colors ${
                  scope === option.value
                    ? 'bg-gray-100 dark:bg-white/[0.12] text-gray-900 dark:text-gray-100 font-medium'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
                onClick={() => onScopeChange(option.value)}
                aria-pressed={scope === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
          <span className="flex-shrink-0 min-w-[4.5rem] flex items-center justify-end">
            {showSpinner && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
            {showMatchCount && results.length > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {results.length} {results.length === 1 ? 'result' : 'results'}
              </span>
            )}
          </span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded transition-colors flex-shrink-0"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {showNoResults && (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-gray-400">
              {scope === 'chapter' ? 'No results in this chapter' : 'No results'}
            </p>
            {scope === 'chapter' && (
              <button
                className="text-xs text-blue-500 hover:text-blue-600 mt-1 transition-colors"
                onClick={() => onScopeChange('book')}
              >
                Search entire book
              </button>
            )}
          </div>
        )}
        {hasResults && (
          <SearchResultsPanel
            results={results}
            query={query}
            highlightedIndex={highlightedIndex}
            truncated={truncated}
            scope={scope}
            onSelect={handleSelectResult}
            onHighlight={onHighlight}
          />
        )}
      </div>
    </div>
  )
}
