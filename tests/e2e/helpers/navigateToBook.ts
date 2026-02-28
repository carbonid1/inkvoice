import type { Page } from '@playwright/test'

export const navigateToBook = async (page: Page) => {
  await page.goto('/')
  await page.waitForSelector('a[href^="/book/"]')
  await page.locator('a[href^="/book/"]').first().click()
  await page.waitForSelector('header h1')
}
