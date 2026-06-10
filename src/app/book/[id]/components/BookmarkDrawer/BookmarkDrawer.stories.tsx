import { fn } from 'storybook/test'
import preview from '#.storybook/preview'
import type { Bookmark } from '@/lib/services/bookmark/bookmark.types'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { BookmarkDrawer } from './BookmarkDrawer'

const BOOK_ID = 'the-strange-case-of-dr-jekyll-and-mr-hyde'

const BOOKMARKS: Bookmark[] = [
  {
    id: 'bookmark-1',
    chapter: 0,
    paragraph: 3,
    createdAt: 1765000000000,
    preview: 'Mr. Utterson the lawyer was a man of a rugged countenance…',
  },
  {
    id: 'bookmark-2',
    chapter: 2,
    paragraph: 11,
    createdAt: 1765100000000,
    preview: 'Nearly a year later, in the month of October…',
  },
]

const CHAPTER_NAMES = ['Story of the Door', 'Search for Mr. Hyde', 'The Carew Murder Case']

const meta = preview.meta({
  component: BookmarkDrawer,
  args: {
    bookId: BOOK_ID,
    isOpen: true,
    onClose: fn(),
    onNavigate: fn(),
    chapterNames: CHAPTER_NAMES,
  },
  beforeEach: () => {
    useBookmarkStore.setState({ bookmarks: { [BOOK_ID]: BOOKMARKS } })
  },
})

/** Drawer open with bookmarks saved across two chapters. */
export const WithBookmarks = meta.story({})

WithBookmarks.test('names the close button for assistive tech', ({ canvas }) => {
  canvas.getByRole('button', { name: 'Close bookmarks' })
})

/** Drawer open before any bookmark has been saved. */
export const Empty = meta.story({
  beforeEach: () => {
    useBookmarkStore.setState({ bookmarks: {} })
  },
})
