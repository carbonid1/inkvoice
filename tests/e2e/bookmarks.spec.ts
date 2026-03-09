import { expect, test } from '@playwright/test'
import { mockBookmarks } from './helpers/mockBookmarks'
import { mockTTS } from './helpers/mockTTS'
import { navigateToBook } from './helpers/navigateToBook'

test.describe('bookmarks', () => {
  test('drawer shows bookmarks and supports navigation', async ({ page }) => {
    await mockTTS(page)
    await mockBookmarks(page)
    await navigateToBook(page)

    // Add a bookmark first (exact case matches player bar, not drawer)
    await page.getByRole('button', { name: 'Add Bookmark', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Remove Bookmark', exact: true })).toBeVisible()

    // Open drawer with Shift+B
    await page.keyboard.press('Shift+B')

    // Drawer should slide in and show the bookmark
    const drawer = page.getByRole('dialog', { name: 'Bookmarks' })
    await expect(drawer).toHaveClass(/translate-x-0/)
    await expect(drawer.getByText('Paragraph 1')).toBeVisible()

    // Close with Escape — slides out
    await page.keyboard.press('Escape')
    await expect(drawer).toHaveClass(/translate-x-full/)
  })

  test('removing bookmark from drawer shows undo toast', async ({ page }) => {
    await mockTTS(page)
    await mockBookmarks(page)
    await navigateToBook(page)

    // Add a bookmark
    await page.getByRole('button', { name: 'Add Bookmark', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Remove Bookmark', exact: true })).toBeVisible()

    // Open drawer and remove the bookmark
    await page.keyboard.press('Shift+B')
    const drawer = page.getByRole('dialog', { name: 'Bookmarks' })
    await expect(drawer.getByText('Paragraph 1')).toBeVisible()

    // Hover bookmark row to reveal X button, then click
    await drawer.getByText('Paragraph 1').hover()
    await drawer.getByRole('button', { name: 'Remove bookmark', exact: true }).click()

    // Toast should appear
    await expect(page.getByText('Bookmark removed')).toBeVisible()
    await expect(drawer.getByText('Paragraph 1')).not.toBeVisible()
  })

  test('undo button in toast restores the bookmark', async ({ page }) => {
    await mockTTS(page)
    await mockBookmarks(page)
    await navigateToBook(page)

    // Add a bookmark
    await page.getByRole('button', { name: 'Add Bookmark', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Remove Bookmark', exact: true })).toBeVisible()

    // Open drawer and remove
    await page.keyboard.press('Shift+B')
    const drawer = page.getByRole('dialog', { name: 'Bookmarks' })
    await drawer.getByText('Paragraph 1').hover()
    await drawer.getByRole('button', { name: 'Remove bookmark', exact: true }).click()

    // Click Undo in toast
    await page.getByRole('button', { name: 'Undo' }).click()

    // Bookmark should reappear in drawer
    await expect(drawer.getByText('Paragraph 1')).toBeVisible()
  })

  test('Ctrl+Z restores removed bookmark', async ({ page }) => {
    await mockTTS(page)
    await mockBookmarks(page)
    await navigateToBook(page)

    // Add a bookmark
    await page.getByRole('button', { name: 'Add Bookmark', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Remove Bookmark', exact: true })).toBeVisible()

    // Open drawer and remove
    await page.keyboard.press('Shift+B')
    const drawer = page.getByRole('dialog', { name: 'Bookmarks' })
    await drawer.getByText('Paragraph 1').hover()
    await drawer.getByRole('button', { name: 'Remove bookmark', exact: true }).click()
    await expect(page.getByText('Bookmark removed')).toBeVisible()

    // Press Ctrl+Z
    await page.keyboard.press('ControlOrMeta+Z')

    // Bookmark should reappear
    await expect(drawer.getByText('Paragraph 1')).toBeVisible()
  })

  test('clicking bookmark button toggles bookmark state', async ({ page }) => {
    await mockTTS(page)
    await mockBookmarks(page)
    await navigateToBook(page)

    // Wait for bookmark button to render (exact case matches player bar, not drawer)
    const bookmarkButton = page.getByRole('button', { name: 'Add Bookmark', exact: true })
    await expect(bookmarkButton).toBeVisible()

    // Click to add bookmark
    await bookmarkButton.click()

    // Should now show "Remove Bookmark"
    await expect(page.getByRole('button', { name: 'Remove Bookmark', exact: true })).toBeVisible()
  })
})
