import { useCallback, useEffect, useRef } from 'react'
import { useBookmarkStore } from '@/store/useBookmarkStore'

interface UseBookmarkToggleArgs {
  bookId: string
  chapter: number
  paragraph: number
  preview?: string
}

interface UseBookmarkToggleReturn {
  isBookmarked: boolean
  toggle: () => void
}

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
