'use client'

import type { BookOverview } from '@/lib/types/book'
import { useHydrated } from '@/store/useHydrated'
import { useLibraryStore } from '@/store/useLibraryStore'
import { useProgressStore } from '@/store/useProgressStore'
import { useEffect, useMemo, useState } from 'react'

type UseBookOverviewResult = {
  overview: BookOverview | null
  loading: boolean
  error: string | null
  initialChapter: number
  initialSentence: number
}

export const useBookOverview = (bookId: string): UseBookOverviewResult => {
  const hydrated = useHydrated()
  const getProgress = useProgressStore(s => s.getProgress)
  const setBookMetadata = useProgressStore(s => s.setBookMetadata)
  const setCurrentBook = useLibraryStore(s => s.setCurrentBook)

  const savedProgress = getProgress(bookId)
  const [overview, setOverview] = useState<BookOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialChapter, setInitialChapter] = useState(savedProgress.chapter)
  const [initialSentence, setInitialSentence] = useState(savedProgress.sentence)

  useEffect(() => {
    if (!hydrated) return

    const controller = new AbortController()

    const fetchOverview = async () => {
      try {
        const response = await fetch(`/api/book/${bookId}`, {
          signal: controller.signal,
        })
        if (!response.ok) {
          if (response.status === 404) throw new Error('Book not found')
          throw new Error('Failed to load book')
        }
        const data: BookOverview = await response.json()
        setOverview(data)
        setCurrentBook(bookId)

        const sentencesPerChapter = data.chapters.map(ch => ch.sentenceCount)
        const wordsPerChapter = data.chapters.map(ch => ch.wordCount)
        setBookMetadata(bookId, data.chapters.length, sentencesPerChapter, wordsPerChapter)

        const progress = getProgress(bookId)
        if (progress.chapter < data.chapters.length) {
          setInitialChapter(progress.chapter)
          const chapterInfo = data.chapters[progress.chapter]
          if (chapterInfo && progress.sentence < chapterInfo.sentenceCount) {
            setInitialSentence(progress.sentence)
          } else {
            setInitialSentence(0)
          }
        } else {
          setInitialChapter(0)
          setInitialSentence(0)
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
        setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchOverview()
    return () => controller.abort()
  }, [bookId, hydrated, getProgress, setCurrentBook, setBookMetadata])

  return useMemo(
    () => ({ overview, loading, error, initialChapter, initialSentence }),
    [overview, loading, error, initialChapter, initialSentence],
  )
}
