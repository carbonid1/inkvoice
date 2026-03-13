import { useBookmarkStore } from '@/store/useBookmarkStore'
import { useCallback, useEffect, useRef } from 'react'
import type { UseBookmarkToggleArgs, UseBookmarkToggleReturn } from './useBookmarkToggle.types'

export const useBookmarkToggle = ({
  bookId,
  chapter,
  paragraph,
  preview,
}: UseBookmarkToggleArgs): UseBookmarkToggleReturn => {
  const isBookmarked = useBookmarkStore(s => s.isBookmarked(bookId, chapter, paragraph))
  const bookmarks = useBookmarkStore(s => s.bookmarks[bookId])
  const addBookmark = useBookmarkStore(s => s.addBookmark)
  const removeBookmark = useBookmarkStore(s => s.removeBookmark)

  const previewRef = useRef(preview)
  useEffect(() => {
    previewRef.current = preview
  }, [preview])

  const toggle = useCallback(() => {
    if (isBookmarked) {
      const bookmark = bookmarks?.find(b => b.chapter === chapter && b.paragraph === paragraph)
      if (bookmark) {
        removeBookmark(bookId, bookmark.id)
      }
    } else {
      addBookmark(bookId, chapter, paragraph, previewRef.current)
    }
  }, [isBookmarked, bookmarks, addBookmark, removeBookmark, bookId, chapter, paragraph])

  return { isBookmarked, toggle }
}
