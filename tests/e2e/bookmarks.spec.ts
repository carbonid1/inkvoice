import { expect, test, type Page } from '@playwright/test'
import { cleanupBookmarks } from './helpers/cleanupBookmarks'
import { mockTTS } from './helpers/mockTTS'
import { navigateToBook } from './helpers/navigateToBook'
import { TEST_BOOK_ID } from './helpers/testBook'

// First body paragraph of chapter 1 in the test book fixture (paragraph index 1, after the heading)
const BOOKMARK_TEXT = 'The morning sun cast long shadows across the quiet village square.'

const clickFirstBodyParagraph = async (page: Page) => {
  await page.locator('main span[data-paragraph]').nth(1).click()
}

/**
 * Bookmarking lets readers save and return to specific paragraphs.
 * Bookmarks persist per book and are accessible through a slide-out drawer.
 */
test.describe('bookmarks', () => {
  test.beforeEach(async ({ request }) => {
    await cleanupBookmarks(request, TEST_BOOK_ID)
  })

  /** Reader adds a bookmark, opens the drawer, and sees it listed with a preview of the paragraph text. */
  test('drawer shows bookmarks and supports navigation', async ({ page }) => {
    await mockTTS(page)
    await navigateToBook(page, TEST_BOOK_ID)

    // Click a body paragraph so the bookmark has a meaningful preview
    await clickFirstBodyParagraph(page)
    await page.getByRole('button', { name: 'Add Bookmark', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Remove Bookmark', exact: true })).toBeVisible()

    // Open drawer with Shift+B
    await page.keyboard.press('Shift+B')

    // Drawer should slide in and show the bookmark
    const drawer = page.getByRole('dialog', { name: 'Bookmarks' })

    await expect(drawer.getByText(BOOKMARK_TEXT)).toBeVisible()

    // Close with Escape — drawer should slide off-screen
    await page.keyboard.press('Escape')
    await expect(drawer).not.toBeInViewport()
  })

  /** Removing a bookmark from the drawer hides it and offers an undo action. */
  test('removing bookmark from drawer shows undo toast', async ({ page }) => {
    await mockTTS(page)
    await navigateToBook(page, TEST_BOOK_ID)

    // Click a body paragraph and add a bookmark
    await clickFirstBodyParagraph(page)
    await page.getByRole('button', { name: 'Add Bookmark', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Remove Bookmark', exact: true })).toBeVisible()

    // Open drawer and remove the bookmark
    await page.keyboard.press('Shift+B')
    const drawer = page.getByRole('dialog', { name: 'Bookmarks' })

    await expect(drawer.getByText(BOOKMARK_TEXT)).toBeVisible()

    // Hover bookmark row to reveal X button, then click
    await drawer.getByText(BOOKMARK_TEXT).hover()
    await drawer.getByRole('button', { name: 'Remove bookmark', exact: true }).click()

    // Toast should appear
    await expect(page.getByText('Bookmark removed')).toBeVisible()
    await expect(drawer.getByText(BOOKMARK_TEXT)).not.toBeVisible()
  })

  /** Clicking "Undo" in the toast restores the bookmark back into the drawer. */
  test('undo button in toast restores the bookmark', async ({ page }) => {
    await mockTTS(page)
    await navigateToBook(page, TEST_BOOK_ID)

    // Click a body paragraph and add a bookmark
    await clickFirstBodyParagraph(page)
    await page.getByRole('button', { name: 'Add Bookmark', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Remove Bookmark', exact: true })).toBeVisible()

    // Open drawer and remove
    await page.keyboard.press('Shift+B')
    const drawer = page.getByRole('dialog', { name: 'Bookmarks' })

    await drawer.getByText(BOOKMARK_TEXT).hover()
    await drawer.getByRole('button', { name: 'Remove bookmark', exact: true }).click()

    // Click Undo in toast
    await page.getByRole('button', { name: 'Undo' }).click()

    // Bookmark should reappear in drawer
    await expect(drawer.getByText(BOOKMARK_TEXT)).toBeVisible()
  })

  /** Ctrl+Z (keyboard undo) restores a removed bookmark, same as clicking the toast button. */
  test('Ctrl+Z restores removed bookmark', async ({ page }) => {
    await mockTTS(page)
    await navigateToBook(page, TEST_BOOK_ID)

    // Click a body paragraph and add a bookmark
    await clickFirstBodyParagraph(page)
    await page.getByRole('button', { name: 'Add Bookmark', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Remove Bookmark', exact: true })).toBeVisible()

    // Open drawer and remove
    await page.keyboard.press('Shift+B')
    const drawer = page.getByRole('dialog', { name: 'Bookmarks' })

    await drawer.getByText(BOOKMARK_TEXT).hover()
    await drawer.getByRole('button', { name: 'Remove bookmark', exact: true }).click()
    await expect(page.getByText('Bookmark removed')).toBeVisible()

    // Press Ctrl+Z
    await page.keyboard.press('ControlOrMeta+Z')

    // Bookmark should reappear
    await expect(drawer.getByText(BOOKMARK_TEXT)).toBeVisible()
  })

  /** The bookmark button in the player bar toggles between "Add" and "Remove" states. */
  test('clicking bookmark button toggles bookmark state', async ({ page }) => {
    await mockTTS(page)
    await navigateToBook(page, TEST_BOOK_ID)

    // Wait for bookmark button to render (exact case matches player bar, not drawer)
    const bookmarkButton = page.getByRole('button', { name: 'Add Bookmark', exact: true })

    await expect(bookmarkButton).toBeVisible()

    // Click to add bookmark
    await bookmarkButton.click()

    // Should now show "Remove Bookmark"
    await expect(page.getByRole('button', { name: 'Remove Bookmark', exact: true })).toBeVisible()
  })
})
