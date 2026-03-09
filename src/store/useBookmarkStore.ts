'use client'

import type { Bookmark } from '@/lib/services/bookmark/bookmark.types'
import { create } from 'zustand'

type LastDeleted = {
  bookId: string
  bookmark: Bookmark
  timerId: ReturnType<typeof setTimeout>
}

export type BookmarkState = {
  bookmarks: Record<string, Bookmark[]>
  lastDeleted: LastDeleted | null
  fetchBookmarks: (bookId: string) => Promise<void>
  addBookmark: (
    bookId: string,
    chapter: number,
    sentence: number,
    preview?: string,
  ) => Promise<Bookmark>
  removeBookmark: (bookId: string, bookmarkId: string) => Promise<void>
  undoRemoveBookmark: () => Promise<void>
  clearLastDeleted: () => void
  isBookmarked: (bookId: string, chapter: number, sentence: number) => boolean
}

const UNDO_WINDOW_MS = 5000

export const useBookmarkStore = create<BookmarkState>()((set, get) => ({
  bookmarks: {},
  lastDeleted: null,

  fetchBookmarks: async bookId => {
    try {
      const response = await fetch(`/api/bookmarks/${bookId}`)
      const bookmarks: Bookmark[] = await response.json()
      set(state => ({ bookmarks: { ...state.bookmarks, [bookId]: bookmarks } }))
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error)
    }
  },

  addBookmark: async (bookId, chapter, sentence, preview?) => {
    try {
      const response = await fetch(`/api/bookmarks/${bookId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapter, sentence, preview }),
      })
      const bookmark: Bookmark = await response.json()
      set(state => ({
        bookmarks: {
          ...state.bookmarks,
          [bookId]: [...(state.bookmarks[bookId] ?? []), bookmark],
        },
      }))
      return bookmark
    } catch (error) {
      console.error('Failed to add bookmark:', error)
      throw error
    }
  },

  removeBookmark: async (bookId, bookmarkId) => {
    try {
      const bookmark = (get().bookmarks[bookId] ?? []).find(b => b.id === bookmarkId)

      await fetch(`/api/bookmarks/${bookId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarkId }),
      })

      // Clear previous undo timer if exists
      const previous = get().lastDeleted
      if (previous) clearTimeout(previous.timerId)

      const timerId = setTimeout(() => get().clearLastDeleted(), UNDO_WINDOW_MS)

      set(state => ({
        bookmarks: {
          ...state.bookmarks,
          [bookId]: (state.bookmarks[bookId] ?? []).filter(b => b.id !== bookmarkId),
        },
        lastDeleted: bookmark ? { bookId, bookmark, timerId } : null,
      }))
    } catch (error) {
      console.error('Failed to remove bookmark:', error)
    }
  },

  undoRemoveBookmark: async () => {
    const { lastDeleted } = get()
    if (!lastDeleted) return

    const { bookId, bookmark } = lastDeleted
    try {
      get().clearLastDeleted()
      await get().addBookmark(bookId, bookmark.chapter, bookmark.sentence, bookmark.preview)
    } catch {
      // Restore undo state so user can retry
      const timerId = setTimeout(() => get().clearLastDeleted(), UNDO_WINDOW_MS)
      set({ lastDeleted: { bookId, bookmark, timerId } })
    }
  },

  clearLastDeleted: () => {
    const { lastDeleted } = get()
    if (lastDeleted) clearTimeout(lastDeleted.timerId)
    set({ lastDeleted: null })
  },

  isBookmarked: (bookId, chapter, sentence) =>
    get().bookmarks[bookId]?.some(b => b.chapter === chapter && b.sentence === sentence) ?? false,
}))
