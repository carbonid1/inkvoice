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
        className="animate-in fade-in-0 slide-in-from-top-2 border-border bg-background mx-auto mt-[15vh] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-xl border shadow-2xl duration-150"
      >
        <div className="border-border flex items-center gap-2 border-b px-4 py-3">
          <Search className="size-4 shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-sm outline-hidden placeholder:text-gray-400"
            aria-label={placeholder}
          />
          <div className="flex shrink-0 rounded-md bg-gray-50 p-0.5 dark:bg-white/[0.06]">
            {SCOPE_OPTIONS.map(option => (
              <button
                key={option.value}
                className={`rounded px-2 py-0.5 text-xs transition-colors ${
                  scope === option.value
                    ? 'bg-gray-100 font-medium text-gray-900 dark:bg-white/[0.12] dark:text-gray-100'
                    : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                }`}
                onClick={() => onScopeChange(option.value)}
                aria-pressed={scope === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
          <span className="flex min-w-[4.5rem] shrink-0 items-center justify-end">
            {showSpinner && <Loader2 className="size-4 animate-spin text-gray-400" />}
            {showMatchCount && results.length > 0 && (
              <span className="text-muted-foreground text-xs tabular-nums">
                {results.length} {results.length === 1 ? 'result' : 'results'}
              </span>
            )}
          </span>
          <button
            onClick={onClose}
            className="hover:bg-accent shrink-0 rounded-sm p-1 transition-colors"
            aria-label="Close search"
          >
            <X className="size-4" />
          </button>
        </div>
        {showNoResults && (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-gray-400">
              {scope === 'chapter' ? 'No results in this chapter' : 'No results'}
            </p>
            {scope === 'chapter' && (
              <button
                className="text-primary hover:text-primary/80 mt-1 text-xs transition-colors"
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
