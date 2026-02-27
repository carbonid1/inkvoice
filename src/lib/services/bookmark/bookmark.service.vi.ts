'use server'

import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createBookmarkService } from './bookmark.service'

describe('bookmarkService', () => {
  let tmpFile: string

  beforeEach(async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'bookmarks-'))
    tmpFile = path.join(dir, 'bookmarks.json')
    await fs.writeFile(tmpFile, '{}')
  })

  afterEach(async () => {
    const dir = path.dirname(tmpFile)
    await fs.rm(dir, { recursive: true })
  })

  it('returns empty array for unknown book', async () => {
    const service = createBookmarkService(tmpFile)
    const bookmarks = await service.getBookmarks('unknown-book')
    expect(bookmarks).toEqual([])
  })

  it('adds a bookmark and returns it', async () => {
    const service = createBookmarkService(tmpFile)
    const bookmark = await service.addBookmark('book-1', 2, 5)
    expect(bookmark).toMatchObject({ chapter: 2, sentence: 5 })
    expect(bookmark.id).toBeTypeOf('string')
    expect(bookmark.createdAt).toBeTypeOf('number')
  })

  it('retrieves added bookmarks', async () => {
    const service = createBookmarkService(tmpFile)
    const added = await service.addBookmark('book-1', 0, 3)
    const bookmarks = await service.getBookmarks('book-1')
    expect(bookmarks).toEqual([added])
  })

  it('returns existing bookmark on duplicate add', async () => {
    const service = createBookmarkService(tmpFile)
    const first = await service.addBookmark('book-1', 3, 7)
    const second = await service.addBookmark('book-1', 3, 7)
    expect(second).toEqual(first)
    const bookmarks = await service.getBookmarks('book-1')
    expect(bookmarks).toHaveLength(1)
  })

  it('removes a bookmark and returns true', async () => {
    const service = createBookmarkService(tmpFile)
    const bookmark = await service.addBookmark('book-1', 1, 0)
    const removed = await service.removeBookmark('book-1', bookmark.id)
    expect(removed).toBe(true)
    const bookmarks = await service.getBookmarks('book-1')
    expect(bookmarks).toEqual([])
  })

  it('returns false when removing non-existent bookmark', async () => {
    const service = createBookmarkService(tmpFile)
    const removed = await service.removeBookmark('book-1', 'no-such-id')
    expect(removed).toBe(false)
  })

  it('stores preview text on bookmark', async () => {
    const service = createBookmarkService(tmpFile)
    const bookmark = await service.addBookmark('book-1', 1, 0, 'The quick brown fox')
    expect(bookmark.preview).toBe('The quick brown fox')
    const bookmarks = await service.getBookmarks('book-1')
    expect(bookmarks[0]?.preview).toBe('The quick brown fox')
  })

  it('truncates preview to 120 characters', async () => {
    const service = createBookmarkService(tmpFile)
    const longText = 'A'.repeat(200)
    const bookmark = await service.addBookmark('book-1', 0, 0, longText)
    expect(bookmark.preview).toHaveLength(120)
  })

  it('omits preview when not provided', async () => {
    const service = createBookmarkService(tmpFile)
    const bookmark = await service.addBookmark('book-1', 0, 0)
    expect(bookmark.preview).toBeUndefined()
  })
})
