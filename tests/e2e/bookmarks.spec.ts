import { expect, test } from '@playwright/test'
import { mockBookmarks } from './helpers/mockBookmarks'
import { mockTTS } from './helpers/mockTTS'

const navigateToBook = async (page: import('@playwright/test').Page) => {
  await page.goto('/')
  await page.waitForSelector('a[href^="/book/"]')
  await page.locator('a[href^="/book/"]').first().click()
  await page.waitForSelector('header h1')
}

test.describe('bookmarks', () => {
  test('drawer shows bookmarks and supports navigation', async ({ page }) => {
    await mockTTS(page)
    await mockBookmarks(page)
    await navigateToBook(page)

    // Add a bookmark first
    const playerBar = page.locator('.fixed.bottom-0')
    await playerBar.getByRole('button', { name: 'Add bookmark' }).click()
    await expect(playerBar.getByRole('button', { name: 'Remove bookmark' })).toBeVisible()

    // Open drawer with Shift+B
    await page.keyboard.press('Shift+B')

    // Drawer should slide in and show the bookmark
    const drawer = page.getByRole('dialog', { name: 'Bookmarks' })
    await expect(drawer).toHaveClass(/translate-x-0/)
    await expect(drawer.getByText('Sentence 1')).toBeVisible()

    // Close with Escape — slides out
    await page.keyboard.press('Escape')
    await expect(drawer).toHaveClass(/translate-x-full/)
  })

  test('clicking bookmark button toggles bookmark state', async ({ page }) => {
    await mockTTS(page)
    await mockBookmarks(page)
    await navigateToBook(page)

    // Player bar bookmark button — initially "Add bookmark"
    const playerBar = page.locator('.fixed.bottom-0')
    const bookmarkButton = playerBar.getByRole('button', { name: 'Add bookmark' })
    await expect(bookmarkButton).toBeVisible()

    // Click to add bookmark
    await bookmarkButton.click()

    // Should now show "Remove bookmark" in the player bar
    await expect(playerBar.getByRole('button', { name: 'Remove bookmark' })).toBeVisible()
  })
})
