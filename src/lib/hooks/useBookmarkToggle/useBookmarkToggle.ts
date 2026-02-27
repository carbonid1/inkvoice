import { useBookmarkStore } from '@/store/useBookmarkStore'
import { useCallback, useEffect, useRef } from 'react'
import type { UseBookmarkToggleArgs, UseBookmarkToggleReturn } from './useBookmarkToggle.types'

export const useBookmarkToggle = ({
  bookId,
  chapter,
  sentence,
  preview,
}: UseBookmarkToggleArgs): UseBookmarkToggleReturn => {
  const isBookmarked = useBookmarkStore(s => s.isBookmarked(bookId, chapter, sentence))
  const bookmarks = useBookmarkStore(s => s.bookmarks[bookId])
  const addBookmark = useBookmarkStore(s => s.addBookmark)
  const removeBookmark = useBookmarkStore(s => s.removeBookmark)

  const previewRef = useRef(preview)
  useEffect(() => {
    previewRef.current = preview
  }, [preview])

  const toggle = useCallback(() => {
    if (isBookmarked) {
      const bookmark = bookmarks?.find(b => b.chapter === chapter && b.sentence === sentence)
      if (bookmark) {
        removeBookmark(bookId, bookmark.id)
      }
    } else {
      addBookmark(bookId, chapter, sentence, previewRef.current)
    }
  }, [isBookmarked, bookmarks, addBookmark, removeBookmark, bookId, chapter, sentence])

  return { isBookmarked, toggle }
}
