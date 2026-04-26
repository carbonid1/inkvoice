import type { APIRequestContext } from '@playwright/test'

export const cleanupBookmarks = async (request: APIRequestContext, bookId: string) => {
  const response = await request.get(`/api/bookmarks/${bookId}`)

  if (!response.ok()) return

  const bookmarks = await response.json()

  for (const bookmark of bookmarks) {
    await request.delete(`/api/bookmarks/${bookId}`, {
      data: { bookmarkId: bookmark.id },
    })
  }
}
