'use client'

import type { Bookmark } from '@/lib/services/bookmark/bookmark.types'
import { create } from 'zustand'

export type BookmarkState = {
  bookmarks: Record<string, Bookmark[]>
  fetchBookmarks: (bookId: string) => Promise<void>
  addBookmark: (
    bookId: string,
    chapter: number,
    sentence: number,
    preview?: string,
  ) => Promise<Bookmark>
  removeBookmark: (bookId: string, bookmarkId: string) => Promise<void>
  isBookmarked: (bookId: string, chapter: number, sentence: number) => boolean
}

export const useBookmarkStore = create<BookmarkState>()((set, get) => ({
  bookmarks: {},

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
      await fetch(`/api/bookmarks/${bookId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarkId }),
      })
      set(state => ({
        bookmarks: {
          ...state.bookmarks,
          [bookId]: (state.bookmarks[bookId] ?? []).filter(b => b.id !== bookmarkId),
        },
      }))
    } catch (error) {
      console.error('Failed to remove bookmark:', error)
    }
  },

  isBookmarked: (bookId, chapter, sentence) =>
    get().bookmarks[bookId]?.some(b => b.chapter === chapter && b.sentence === sentence) ?? false,
}))
