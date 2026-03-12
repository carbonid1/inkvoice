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

test.describe('book management', () => {
  test('Add Book card is visible in the library grid', async ({ page }) => {
    await mockBookManagement(page)
    await waitForLibrary(page)

    await expect(page.getByText('Add Book')).toBeVisible()
  })

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

  test('removing a book hides it and shows undo toast', async ({ page }) => {
    await mockBookManagement(page)
    await waitForLibrary(page)

    // Hover the first book card to reveal the remove button
    await page.locator('a[href^="/book/"]').first().hover()
    await page.getByRole('button', { name: 'Remove Mock Book One' }).click()

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

  test('undo button restores the removed book', async ({ page }) => {
    await mockBookManagement(page)
    await waitForLibrary(page)

    // Remove the first book
    await page.locator('a[href^="/book/"]').first().hover()
    await page.getByRole('button', { name: 'Remove Mock Book One' }).click()
    await expect(page.getByText('Book removed')).toBeVisible()

    // Click Undo
    await page.getByRole('button', { name: 'Undo' }).click()

    // Book should reappear
    await expect(
      page.locator('a[href^="/book/"] h3').filter({ hasText: 'Mock Book One' }),
    ).toBeVisible()
  })

  test('Ctrl+Z restores the removed book', async ({ page }) => {
    await mockBookManagement(page)
    await waitForLibrary(page)

    // Remove the first book
    await page.locator('a[href^="/book/"]').first().hover()
    await page.getByRole('button', { name: 'Remove Mock Book One' }).click()
    await expect(page.getByText('Book removed')).toBeVisible()

    // Press Ctrl+Z
    await page.keyboard.press('ControlOrMeta+Z')

    // Book should reappear
    await expect(
      page.locator('a[href^="/book/"] h3').filter({ hasText: 'Mock Book One' }),
    ).toBeVisible()
  })
})
