import { expect, test } from '@playwright/test'
import { mockTTS } from './helpers/mockTTS'
import { navigateToBook } from './helpers/navigateToBook'
import { TEST_BOOK_ID } from './helpers/testBook'

const CHAPTER_A = 0
const CHAPTER_B = 1
const PARAGRAPH_INDEX = 1

const activeParagraph = (page: import('@playwright/test').Page) =>
  page.locator('main span[data-active-paragraph]')

const allParagraphs = (page: import('@playwright/test').Page) =>
  page.locator('main span.cursor-pointer')

const tocButton = (page: import('@playwright/test').Page) =>
  page.locator('button[aria-label="Table of Contents"]')

const selectChapter = async (page: import('@playwright/test').Page, index: number) => {
  await tocButton(page).click()
  const drawer = page.getByRole('dialog', { name: 'Table of Contents' })
  await drawer.waitFor()
  // Expand all collapsed groups so all chapters are visible
  const collapsedToggles = drawer.locator('button[aria-label="Expand"]')
  const count = await collapsedToggles.count()
  for (let i = 0; i < count; i++) {
    await collapsedToggles.nth(0).click()
  }
  // Wait for chapter API response before checking DOM
  const chapterResponse = page.waitForResponse(
    resp =>
      resp.url().includes('/api/book/') &&
      resp.url().includes('/chapter/') &&
      resp.status() === 200,
  )
  await drawer.locator(`button[data-chapter-index="${index}"]`).click()
  await chapterResponse
  // Wait for the drawer close animation to finish — the CSS transition and
  // associated React re-renders can detach paragraph DOM nodes mid-click
  await expect(drawer).toHaveClass(/-translate-x-full/)
  await allParagraphs(page).first().waitFor()
}

const setupAndClickParagraph = async (page: import('@playwright/test').Page) => {
  await mockTTS(page)
  await navigateToBook(page, TEST_BOOK_ID)

  // Wait for chapter content to render (starts on CHAPTER_A by default)
  await allParagraphs(page).first().waitFor()

  const target = allParagraphs(page).nth(PARAGRAPH_INDEX)
  await target.click()
  await expect(activeParagraph(page)).toBeVisible()

  const text = await activeParagraph(page).textContent()
  return text!
}

/**
 * Reading position is remembered per chapter. When a reader selects a paragraph,
 * navigates to a different chapter via the TOC, and returns, the previously
 * selected paragraph is still highlighted.
 */
test.describe('chapter position preservation', () => {
  /** Clicking a paragraph, switching chapters, and switching back restores the highlighted paragraph. */
  test('preserves paragraph position when switching chapters and returning', async ({ page }) => {
    const expectedText = await setupAndClickParagraph(page)

    // Switch to a different chapter
    await selectChapter(page, CHAPTER_B)

    // Switch back to the original chapter
    await selectChapter(page, CHAPTER_A)

    // The previously selected paragraph should still be highlighted
    await expect(activeParagraph(page)).toBeVisible()
    await expect(activeParagraph(page)).toHaveText(expectedText)
  })
})
