import type { Page } from '@playwright/test'

export const navigateToBook = async (page: Page, bookId?: string) => {
  if (bookId) {
    await page.goto(`/book/${bookId}`)
    await page.locator('header h1').waitFor()
    return
  }

  const booksResponse = page.waitForResponse(
    resp => resp.url().includes('/api/books') && resp.status() === 200,
  )

  await page.goto('/')
  await booksResponse
  // The onboarding checklist also links to /book/…; only grid cards have a title heading.
  const bookCard = page.locator('a[href^="/book/"]:has(h3)').first()

  await bookCard.waitFor()
  await bookCard.click()
  await page.locator('header h1').waitFor()
}
