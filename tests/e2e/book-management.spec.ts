import { expect, test } from '@playwright/test'
import { mockBookManagement } from './helpers/mockBookManagement'

const waitForLibrary = async (page: import('@playwright/test').Page) => {
  const booksResponse = page.waitForResponse(
    resp => resp.url().includes('/api/books') && resp.status() === 200,
  )
  await page.goto('/')
  await booksResponse
  await page.waitForSelector('a[href^="/book/"]')
}

/**
 * The library is the reader's home screen. Books can be added by uploading
 * an EPUB file and removed via right-click context menu. Removal is undoable
 * through the toast or Ctrl+Z.
 */
test.describe('book management', () => {
  /** The library grid includes an "Add Book" card for uploading new books. */
  test('Add Book card is visible in the library grid', async ({ page }) => {
    await mockBookManagement(page)
    await waitForLibrary(page)

    await expect(page.getByText('Add Book')).toBeVisible()
  })

  /** Selecting an EPUB file through the Add Book card adds it to the library immediately. */
  test('uploading a book adds it to the grid', async ({ page }) => {
    const { getUploadedBooks } = await mockBookManagement(page)
    await waitForLibrary(page)

    // Set up the file chooser before clicking
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByText('Add Book').click()
    const fileChooser = await fileChooserPromise

    // Create a fake .epub file and upload it
    await fileChooser.setFiles({
      name: 'Test Book.epub',
      mimeType: 'application/epub+zip',
      buffer: Buffer.from('fake epub content'),
    })

    // The mock returns a book with title "Test Book" — it should appear in the grid
    await expect(page.getByText('Test Book')).toBeVisible()
    expect(getUploadedBooks().map(b => b.filename)).toContain('Test Book.epub')
  })

  /** Right-click → "Remove Book" hides the book from the grid and shows an undo toast. */
  test('removing a book hides it and shows undo toast', async ({ page }) => {
    await mockBookManagement(page)
    await waitForLibrary(page)

    // Right-click the first book to open context menu
    await page.locator('a[href^="/book/"]').first().click({ button: 'right' })
    await page.locator('[role="menuitem"]', { hasText: 'Remove Book' }).click()

    // Book should disappear and toast should show
    await expect(page.getByText('Book removed')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible()

    // The removed book should no longer be in the grid
    await expect(
      page.locator('a[href^="/book/"] h3').filter({ hasText: 'Mock Book One' }),
    ).not.toBeVisible()
    // The other book should still be visible
    await expect(page.getByText('Mock Book Two')).toBeVisible()
  })

  /** Clicking "Undo" in the toast brings the book back. */
  test('undo button restores the removed book', async ({ page }) => {
    await mockBookManagement(page)
    await waitForLibrary(page)

    // Remove the first book via context menu
    await page.locator('a[href^="/book/"]').first().click({ button: 'right' })
    await page.locator('[role="menuitem"]', { hasText: 'Remove Book' }).click()
    await expect(page.getByText('Book removed')).toBeVisible()

    // Click Undo
    await page.getByRole('button', { name: 'Undo' }).click()

    // Book should reappear
    await expect(
      page.locator('a[href^="/book/"] h3').filter({ hasText: 'Mock Book One' }),
    ).toBeVisible()
  })

  /** Ctrl+Z restores the book, same as the toast button. */
  test('Ctrl+Z restores the removed book', async ({ page }) => {
    await mockBookManagement(page)
    await waitForLibrary(page)

    // Remove the first book via context menu
    await page.locator('a[href^="/book/"]').first().click({ button: 'right' })
    await page.locator('[role="menuitem"]', { hasText: 'Remove Book' }).click()
    await expect(page.getByText('Book removed')).toBeVisible()

    // Press Ctrl+Z
    await page.keyboard.press('ControlOrMeta+Z')

    // Book should reappear
    await expect(
      page.locator('a[href^="/book/"] h3').filter({ hasText: 'Mock Book One' }),
    ).toBeVisible()
  })
})
