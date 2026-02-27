import { type Page } from '@playwright/test'
import { randomUUID } from 'crypto'

type Bookmark = {
  id: string
  chapter: number
  sentence: number
  createdAt: number
}

export const mockBookmarks = async (page: Page) => {
  const store = new Map<string, Bookmark[]>()

  await page.route('**/api/bookmarks/**', (route, request) => {
    const url = new URL(request.url())
    const segments = url.pathname.split('/')
    const bookId = segments[segments.length - 1] ?? ''
    const method = request.method()

    if (method === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(store.get(bookId) ?? []),
      })
      return
    }

    if (method === 'POST') {
      const body = request.postDataJSON() as { chapter: number; sentence: number }
      const bookmark: Bookmark = {
        id: randomUUID(),
        chapter: body.chapter,
        sentence: body.sentence,
        createdAt: Date.now(),
      }
      const existing = store.get(bookId) ?? []
      store.set(bookId, [...existing, bookmark])
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(bookmark),
      })
      return
    }

    if (method === 'DELETE') {
      const body = request.postDataJSON() as { bookmarkId: string }
      const bookmarks = store.get(bookId) ?? []
      store.set(
        bookId,
        bookmarks.filter(b => b.id !== body.bookmarkId),
      )
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
      return
    }

    route.continue()
  })
}
