'use client'

import { Tooltip } from '@/components/Tooltip/Tooltip'
import { ChevronDown, ChevronUp, Loader2, Search, X } from 'lucide-react'
import { type KeyboardEvent, useEffect, useRef } from 'react'
import type { SearchBarProps } from './SearchBar.types'

export const SearchBar = ({
  query,
  totalMatches,
  currentMatchIndex,
  loading,
  onQueryChange,
  onNext,
  onPrevious,
  onClose,
}: SearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        onPrevious()
      } else {
        onNext()
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  const showMatchCount = query.length >= 2 && !loading
  const showNoResults = showMatchCount && totalMatches === 0

  return (
    <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-3xl mx-auto px-4 py-2 flex items-center gap-2">
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
        {showMatchCount && totalMatches > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 tabular-nums">
            {currentMatchIndex + 1} of {totalMatches}
          </span>
        )}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Tooltip label="Previous Match" shortcut="Shift+Enter" position="bottom">
            <button
              onClick={onPrevious}
              disabled={totalMatches === 0}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors disabled:opacity-30"
              aria-label="Previous match"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip label="Next Match" shortcut="Enter" position="bottom">
            <button
              onClick={onNext}
              disabled={totalMatches === 0}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors disabled:opacity-30"
              aria-label="Next match"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
        <Tooltip label="Close" shortcut="Escape" position="bottom">
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
