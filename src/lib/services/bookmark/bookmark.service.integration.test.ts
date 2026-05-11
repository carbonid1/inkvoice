import { describe, expect, it } from 'vitest'
import { seedBook } from '../../../../tests/integration/helpers/seedBook/seedBook'
import { prisma } from '../db/db.service'
import { bookmarkService } from './bookmark.service'

describe('bookmarkService (integration)', () => {
  it('returns false when removing a bookmark that does not exist', async () => {
    await seedBook()

    const removed = await bookmarkService.removeBookmark('book-1', 'no-such-id')

    expect(removed).toBe(false)
  })

  it('omits preview when not provided (null in DB → undefined on the bookmark)', async () => {
    await seedBook()

    const created = await bookmarkService.addBookmark('book-1', 0, 0)

    expect(created.preview).toBeUndefined()

    const stored = await prisma.bookmark.findUnique({ where: { id: created.id } })

    expect(stored?.preview).toBeNull()
  })

  it('returns existing bookmark on duplicate add — no second row created', async () => {
    await seedBook()

    const first = await bookmarkService.addBookmark('book-1', 3, 7)
    const second = await bookmarkService.addBookmark('book-1', 3, 7)

    expect(second.id).toBe(first.id)

    const rows = await prisma.bookmark.findMany({ where: { bookId: 'book-1' } })

    expect(rows).toHaveLength(1)
  })

  it('truncates preview to 120 characters and persists the truncated value', async () => {
    await seedBook()
    const longText = 'A'.repeat(200)

    const created = await bookmarkService.addBookmark('book-1', 0, 0, longText)

    expect(created.preview).toHaveLength(120)

    const stored = await prisma.bookmark.findUnique({ where: { id: created.id } })

    expect(stored?.preview).toHaveLength(120)
  })
})
