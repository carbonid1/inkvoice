import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import type { Bookmark, BookmarkMap } from './bookmark.types'

const DEFAULT_FILE = path.join(process.cwd(), 'data', 'bookmarks.json')

export const createBookmarkService = (filePath = DEFAULT_FILE) => {
  const readMap = async (): Promise<BookmarkMap> => {
    try {
      const data = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(data) as BookmarkMap
    } catch {
      return {}
    }
  }

  const writeMap = async (map: BookmarkMap): Promise<void> => {
    await fs.writeFile(filePath, JSON.stringify(map, null, 2))
  }

  const getBookmarks = async (bookId: string): Promise<Bookmark[]> => {
    const map = await readMap()
    return map[bookId] ?? []
  }

  const addBookmark = async (
    bookId: string,
    chapter: number,
    sentence: number,
    preview?: string,
  ): Promise<Bookmark> => {
    const map = await readMap()
    const bookmarks = map[bookId] ?? []

    const existing = bookmarks.find(b => b.chapter === chapter && b.sentence === sentence)
    if (existing) return existing

    const bookmark: Bookmark = {
      id: crypto.randomUUID(),
      chapter,
      sentence,
      createdAt: Date.now(),
      ...(preview !== undefined && { preview: preview.slice(0, 120) }),
    }

    map[bookId] = [...bookmarks, bookmark]
    await writeMap(map)
    return bookmark
  }

  const removeBookmark = async (bookId: string, bookmarkId: string): Promise<boolean> => {
    const map = await readMap()
    const bookmarks = map[bookId]
    if (!bookmarks) return false

    const index = bookmarks.findIndex(b => b.id === bookmarkId)
    if (index === -1) return false

    map[bookId] = bookmarks.filter(b => b.id !== bookmarkId)
    await writeMap(map)
    return true
  }

  const removeAllBookmarks = async (bookId: string): Promise<boolean> => {
    const map = await readMap()
    if (!(bookId in map)) return false

    const { [bookId]: _, ...rest } = map
    await writeMap(rest)
    return true
  }

  return {
    getBookmarks,
    addBookmark,
    removeBookmark,
    removeAllBookmarks,
  }
}

export const bookmarkService = createBookmarkService()
