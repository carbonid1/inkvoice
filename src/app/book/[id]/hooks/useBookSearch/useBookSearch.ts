'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SearchMatch, SearchResponse, UseBookSearchResult } from './useBookSearch.types'

const DEBOUNCE_MS = 300

export const useBookSearch = (bookId: string): UseBookSearchResult => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQueryState] = useState('')
  const [results, setResults] = useState<SearchMatch[]>([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [truncated, setTruncated] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resultsLengthRef = useRef(0)

  // Keep ref in sync
  resultsLengthRef.current = results.length

  const open = useCallback(() => setIsOpen(true), [])

  const close = useCallback(() => {
    setIsOpen(false)
    setQueryState('')
    setResults([])
    setCurrentMatchIndex(0)
    setLoading(false)
    setTruncated(false)
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
        setCurrentMatchIndex(0)
        setLoading(false)
        setTruncated(false)
        return
      }

      const controller = new AbortController()
      abortControllerRef.current = controller
      setLoading(true)

      try {
        const response = await fetch(
          `/api/book/${bookId}/search?q=${encodeURIComponent(searchQuery)}`,
          { signal: controller.signal },
        )

        if (!response.ok) throw new Error('Search failed')

        const data: SearchResponse = await response.json()

        if (!controller.signal.aborted) {
          setResults(data.matches)
          setCurrentMatchIndex(0)
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

  const goToNextMatch = useCallback(() => {
    const len = resultsLengthRef.current
    if (len === 0) return
    setCurrentMatchIndex(prev => (prev + 1) % len)
  }, [])

  const goToPreviousMatch = useCallback(() => {
    const len = resultsLengthRef.current
    if (len === 0) return
    setCurrentMatchIndex(prev => (prev - 1 + len) % len)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort()
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [])

  const currentMatch = results.length > 0 ? (results[currentMatchIndex] ?? null) : null

  return useMemo(
    () => ({
      isOpen,
      query,
      results,
      totalMatches: results.length,
      currentMatchIndex,
      currentMatch,
      loading,
      truncated,
      open,
      close,
      setQuery,
      goToNextMatch,
      goToPreviousMatch,
    }),
    [
      isOpen,
      query,
      results,
      currentMatchIndex,
      currentMatch,
      loading,
      truncated,
      open,
      close,
      setQuery,
      goToNextMatch,
      goToPreviousMatch,
    ],
  )
}
