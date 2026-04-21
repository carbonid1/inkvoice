'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  SearchMatch,
  SearchResponse,
  SearchScope,
  UseBookSearchResult,
} from './useBookSearch.types'

const DEBOUNCE_MS = 300

export const useBookSearch = (bookId: string, currentChapter: number): UseBookSearchResult => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQueryState] = useState('')
  const [results, setResults] = useState<SearchMatch[]>([])
  const [highlightedIndex, setHighlightedIndexState] = useState(0)
  const [loading, setLoading] = useState(false)
  const [truncated, setTruncated] = useState(false)
  const [scope, setScopeState] = useState<SearchScope>('book')

  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resultsLengthRef = useRef(0)
  const scopeRef = useRef<SearchScope>('book')
  const currentChapterRef = useRef(currentChapter)
  const queryRef = useRef('')

  // Keep refs in sync with latest values for use inside async callbacks
  useEffect(() => {
    resultsLengthRef.current = results.length
    scopeRef.current = scope
    currentChapterRef.current = currentChapter
    queryRef.current = query
  })

  const open = useCallback(() => setIsOpen(true), [])

  const close = useCallback(() => {
    setIsOpen(false)
    setQueryState('')
    setResults([])
    setHighlightedIndexState(0)
    setLoading(false)
    setTruncated(false)
    setScopeState('book')
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
  }, [])

  const fetchResults = useCallback(
    async (searchQuery: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      if (searchQuery.length < 2) {
        setResults([])
        setLoading(false)
        setTruncated(false)
        return
      }

      const controller = new AbortController()
      abortControllerRef.current = controller
      setLoading(true)

      try {
        const params = new URLSearchParams({ q: searchQuery })
        if (scopeRef.current === 'chapter') {
          params.set('chapter', String(currentChapterRef.current))
        }
        const response = await fetch(`/api/book/${bookId}/search?${params}`, {
          signal: controller.signal,
        })

        if (!response.ok) throw new Error('Search failed')

        const data: SearchResponse = await response.json()

        if (!controller.signal.aborted) {
          setResults(data.matches)
          setHighlightedIndexState(0)
          setTruncated(data.truncated)
          setLoading(false)
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    },
    [bookId],
  )

  const setQuery = useCallback(
    (newQuery: string) => {
      setQueryState(newQuery)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        fetchResults(newQuery)
      }, DEBOUNCE_MS)
    },
    [fetchResults],
  )

  const setScope = useCallback(
    (newScope: SearchScope) => {
      setScopeState(newScope)
      scopeRef.current = newScope // Eager update so fetchResults reads new scope before re-render
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
      if (queryRef.current.length >= 2) {
        fetchResults(queryRef.current)
      }
    },
    [fetchResults],
  )

  const highlightNext = useCallback(() => {
    const len = resultsLengthRef.current
    if (len === 0) return
    setHighlightedIndexState(prev => (prev + 1) % len)
  }, [])

  const highlightPrevious = useCallback(() => {
    const len = resultsLengthRef.current
    if (len === 0) return
    setHighlightedIndexState(prev => (prev - 1 + len) % len)
  }, [])

  const setHighlightedIndex = useCallback((index: number) => {
    setHighlightedIndexState(index)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort()
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [])

  return useMemo(
    () => ({
      isOpen,
      query,
      results,
      highlightedIndex,
      highlightedMatch: results.length > 0 ? (results[highlightedIndex] ?? null) : null,
      loading,
      truncated,
      open,
      close,
      setQuery,
      highlightNext,
      highlightPrevious,
      setHighlightedIndex,
      scope,
      setScope,
    }),
    [
      isOpen,
      query,
      results,
      highlightedIndex,
      loading,
      truncated,
      open,
      close,
      setQuery,
      highlightNext,
      highlightPrevious,
      setHighlightedIndex,
      scope,
      setScope,
    ],
  )
}
