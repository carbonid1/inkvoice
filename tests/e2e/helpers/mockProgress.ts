import type { Page } from '@playwright/test'

export const mockProgress = async (page: Page) => {
  await page.route('**/api/progress', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    })
  })

  await page.route('**/api/progress/**', (route, request) => {
    const method = request.method()

    if (method === 'GET') {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Progress not found' }),
      })
      return
    }

    if (method === 'PUT') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
      return
    }

    if (method === 'DELETE') {
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
