import type { Page } from '@playwright/test'

export const navigateToBook = async (page: Page, bookId?: string) => {
  if (bookId) {
    await page.goto(`/book/${bookId}`)
    await page.waitForSelector('header h1')
    return
  }

  const booksResponse = page.waitForResponse(
    resp => resp.url().includes('/api/books') && resp.status() === 200,
  )
  await page.goto('/')
  await booksResponse
  await page.waitForSelector('a[href^="/book/"]')
  await page.locator('a[href^="/book/"]').first().click()
  await page.waitForSelector('header h1')
}
