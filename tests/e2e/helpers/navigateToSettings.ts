import type { Page } from '@playwright/test'

export const navigateToSettings = async (page: Page) => {
  const voicesResponse = page.waitForResponse(
    resp => resp.url().includes('/api/voices') && resp.status() === 200,
  )
  await page.goto('/settings')
  await voicesResponse
  await page.locator('[data-voice]').first().waitFor()
}
