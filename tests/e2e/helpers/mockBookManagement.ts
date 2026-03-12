import type { Page } from '@playwright/test'

type Book = {
  id: string
  title: string
  author: string
  filename: string
}

const MOCK_BOOKS: Book[] = [
  {
    id: 'mock_book_one',
    title: 'Mock Book One',
    author: 'Author A',
    filename: 'Mock Book One.epub',
  },
  {
    id: 'mock_book_two',
    title: 'Mock Book Two',
    author: 'Author B',
    filename: 'Mock Book Two.epub',
  },
]

export const mockBookManagement = async (page: Page) => {
  const uploadedBooks: Book[] = []
  const deletedIds = new Set<string>()

  // Mock GET /api/books (must be registered before navigation)
  // Also mock POST /api/books (upload) on the same route
  await page.route('**/api/books', (route, request) => {
    const method = request.method()

    if (method === 'GET') {
      const visible = [...MOCK_BOOKS, ...uploadedBooks].filter(b => !deletedIds.has(b.id))
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(visible),
      })
      return
    }

    if (method === 'POST') {
      const postData = request.postData() ?? ''
      const filenameMatch = postData.match(/filename="([^"]+)"/)
      const filename = filenameMatch?.[1] ?? 'unknown.epub'

      const id = filename.replace('.epub', '').replace(/[^a-zA-Z0-9-_]/g, '_')
      const title = filename.replace('.epub', '')
      const book: Book = { id, title, author: 'Test Author', filename }
      uploadedBooks.push(book)

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(book),
      })
      return
    }

    route.fallback()
  })

  // Mock DELETE and PATCH /api/books/{id}
  await page.route('**/api/books/*', (route, request) => {
    const method = request.method()
    const url = new URL(request.url())
    const segments = url.pathname.split('/')
    const id = segments[segments.length - 1] ?? ''

    if (method === 'DELETE') {
      deletedIds.add(id)
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
      return
    }

    if (method === 'PATCH') {
      deletedIds.delete(id)
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
      return
    }

    route.fallback()
  })

  // Mock cover images to prevent 404s
  await page.route('**/api/book/*/cover', route => {
    route.fulfill({ status: 404 })
  })

  return {
    getUploadedBooks: () => [...uploadedBooks],
    getDeletedIds: () => new Set(deletedIds),
  }
}
