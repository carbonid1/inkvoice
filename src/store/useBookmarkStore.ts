'use client'

import { create } from 'zustand'
import type { Bookmark } from '@/lib/services/bookmark/bookmark.types'

interface LastDeleted {
  bookId: string
  bookmark: Bookmark
  timerId: ReturnType<typeof setTimeout>
}

export interface BookmarkState {
  bookmarks: Record<string, Bookmark[]>
  lastDeleted: LastDeleted | null
  fetchBookmarks: (bookId: string) => Promise<void>
  addBookmark: (
    bookId: string,
    chapter: number,
    paragraph: number,
    preview?: string,
  ) => Promise<Bookmark>
  removeBookmark: (bookId: string, bookmarkId: string) => Promise<void>
  undoRemoveBookmark: () => Promise<void>
  clearLastDeleted: () => void
  isBookmarked: (bookId: string, chapter: number, paragraph: number) => boolean
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

  addBookmark: async (bookId, chapter, paragraph, preview?) => {
    const existing = (get().bookmarks[bookId] ?? []).find(
      b => b.chapter === chapter && b.paragraph === paragraph,
    )

    if (existing) return existing

    const optimistic: Bookmark = {
      id: crypto.randomUUID(),
      chapter,
      paragraph,
      createdAt: Date.now(),
      ...(preview !== undefined && { preview }),
    }

    set(state => ({
      bookmarks: {
        ...state.bookmarks,
        [bookId]: [...(state.bookmarks[bookId] ?? []), optimistic],
      },
    }))

    try {
      const response = await fetch(`/api/bookmarks/${bookId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapter, paragraph, preview }),
      })

      if (!response.ok) throw new Error(`Bookmark creation failed: ${response.status}`)
      const serverBookmark: Bookmark = await response.json()

      set(state => ({
        bookmarks: {
          ...state.bookmarks,
          [bookId]: (state.bookmarks[bookId] ?? []).map(b =>
            b.id === optimistic.id ? serverBookmark : b,
          ),
        },
      }))

      return serverBookmark
    } catch (error) {
      set(state => ({
        bookmarks: {
          ...state.bookmarks,
          [bookId]: (state.bookmarks[bookId] ?? []).filter(b => b.id !== optimistic.id),
        },
      }))
      throw error
    }
  },

  removeBookmark: async (bookId, bookmarkId) => {
    const bookmark = (get().bookmarks[bookId] ?? []).find(b => b.id === bookmarkId)

    if (!bookmark) return

    const previous = get().lastDeleted

    if (previous) clearTimeout(previous.timerId)

    const timerId = setTimeout(() => get().clearLastDeleted(), UNDO_WINDOW_MS)

    set(state => ({
      bookmarks: {
        ...state.bookmarks,
        [bookId]: (state.bookmarks[bookId] ?? []).filter(b => b.id !== bookmarkId),
      },
      lastDeleted: { bookId, bookmark, timerId },
    }))

    try {
      await fetch(`/api/bookmarks/${bookId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarkId }),
      })
    } catch {
      const current = get().lastDeleted

      if (current) clearTimeout(current.timerId)

      set(state => ({
        bookmarks: {
          ...state.bookmarks,
          [bookId]: [...(state.bookmarks[bookId] ?? []), bookmark],
        },
        lastDeleted: null,
      }))
    }
  },

  undoRemoveBookmark: async () => {
    const { lastDeleted } = get()

    if (!lastDeleted) return

    const { bookId, bookmark } = lastDeleted

    try {
      get().clearLastDeleted()
      await get().addBookmark(bookId, bookmark.chapter, bookmark.paragraph, bookmark.preview)
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

  isBookmarked: (bookId, chapter, paragraph) =>
    get().bookmarks[bookId]?.some(b => b.chapter === chapter && b.paragraph === paragraph) ?? false,
}))
