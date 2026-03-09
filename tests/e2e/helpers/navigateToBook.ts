import type { Page } from '@playwright/test'

export const navigateToBook = async (page: Page) => {
  const booksResponse = page.waitForResponse(
    resp => resp.url().includes('/api/books') && resp.status() === 200,
  )
  await page.goto('/')
  await booksResponse
  await page.waitForSelector('a[href^="/book/"]')
  await page.locator('a[href^="/book/"]').first().click()
  await page.waitForSelector('header h1')
}
