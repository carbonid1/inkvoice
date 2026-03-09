'use client'

import { Tooltip } from '@/components/Tooltip/Tooltip'
import { formatTimeAgo } from '@/lib/helpers/formatTimeAgo/formatTimeAgo'
import { getModKey } from '@/lib/helpers/getModKey/getModKey'
import type { Bookmark } from '@/lib/services/bookmark/bookmark.types'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { toast } from 'sonner'
import type { BookmarkDrawerProps } from './BookmarkDrawer.types'

export const BookmarkDrawer = ({
  bookId,
  isOpen,
  onClose,
  onNavigate,
  chapterNames,
}: BookmarkDrawerProps) => {
  const bookmarks = useBookmarkStore(s => s.bookmarks[bookId] ?? [])
  const removeBookmark = useBookmarkStore(s => s.removeBookmark)
  const undoRemoveBookmark = useBookmarkStore(s => s.undoRemoveBookmark)
  const drawerRef = useRef<HTMLDivElement>(null)

  const handleRemove = async (bookmark: Bookmark) => {
    await removeBookmark(bookId, bookmark.id)
    toast('Bookmark removed', {
      description: `${getModKey()}+Z to undo`,
      action: { label: 'Undo', onClick: () => undoRemoveBookmark() },
      duration: 5000,
    })
  }

  useHotkeys('shift+b', onClose, { enabled: isOpen })
  useHotkeys('escape', onClose, { enabled: isOpen })

  // Trap focus inside drawer when open
  useEffect(() => {
    if (isOpen) {
      drawerRef.current?.focus()
    }
  }, [isOpen])

  const sorted = [...bookmarks].sort((a, b) => {
    if (a.chapter !== b.chapter) return a.chapter - b.chapter
    return a.sentence - b.sentence
  })

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-30 transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-label="Bookmarks"
        tabIndex={-1}
        className={`fixed inset-y-0 right-0 w-96 max-w-[85vw] z-40 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl transition-transform duration-200 ease-out outline-none ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Bookmarks</h2>
          <Tooltip label="Close" shortcut="Esc" position="bottom">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>

        {/* List */}
        <div className="overflow-y-auto h-[calc(100%-57px)]">
          {sorted.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">No bookmarks yet</p>
            </div>
          ) : (
            <ul className="pt-1 pb-8">
              {sorted.map(bookmark => (
                <li key={bookmark.id}>
                  <button
                    onClick={() => {
                      onNavigate(bookmark.chapter, bookmark.sentence)
                      onClose()
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between group"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium">
                        {chapterNames[bookmark.chapter] ?? `Chapter ${bookmark.chapter + 1}`}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {bookmark.preview ?? `Paragraph ${bookmark.sentence + 1}`}
                      </p>
                      <span className="text-xs text-gray-400 dark:text-gray-400">
                        {formatTimeAgo(bookmark.createdAt)}
                      </span>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleRemove(bookmark)
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Remove bookmark"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
