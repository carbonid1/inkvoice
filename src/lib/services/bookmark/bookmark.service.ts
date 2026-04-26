import { swallowRecordNotFound } from '../../helpers/swallowRecordNotFound/swallowRecordNotFound'
import { prisma } from '../db/db.service'
import type { Bookmark } from './bookmark.types'

const toBookmark = (row: {
  id: string
  chapter: number
  paragraph: number
  createdAt: number
  preview: string | null
}): Bookmark => ({
  id: row.id,
  chapter: row.chapter,
  paragraph: row.paragraph,
  createdAt: row.createdAt,
  ...(row.preview !== null && { preview: row.preview }),
})

const getBookmarks = async (bookId: string): Promise<Bookmark[]> => {
  const rows = await prisma.bookmark.findMany({
    where: { bookId },
    orderBy: { createdAt: 'asc' },
  })

  return rows.map(toBookmark)
}

const addBookmark = async (
  bookId: string,
  chapter: number,
  paragraph: number,
  preview?: string,
): Promise<Bookmark> => {
  const existing = await prisma.bookmark.findFirst({
    where: { bookId, chapter, paragraph },
  })

  if (existing) return toBookmark(existing)

  const row = await prisma.bookmark.create({
    data: {
      bookId,
      chapter,
      paragraph,
      createdAt: Date.now(),
      ...(preview !== undefined && { preview: preview.slice(0, 120) }),
    },
  })

  return toBookmark(row)
}

const removeBookmark = async (bookId: string, bookmarkId: string): Promise<boolean> => {
  const existing = await prisma.bookmark.findFirst({
    where: { id: bookmarkId, bookId },
  })

  if (!existing) return false

  await swallowRecordNotFound(() => prisma.bookmark.delete({ where: { id: bookmarkId } }))
  return true
}

const removeAllBookmarks = async (bookId: string): Promise<boolean> => {
  const result = await prisma.bookmark.deleteMany({ where: { bookId } })

  return result.count > 0
}

export const bookmarkService = {
  getBookmarks,
  addBookmark,
  removeBookmark,
  removeAllBookmarks,
}
