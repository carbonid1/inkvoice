import { expect, test } from '@playwright/test'
import { mockBookmarks } from './helpers/mockBookmarks'
import { mockProgress } from './helpers/mockProgress'
import { mockSettings } from './helpers/mockSettings'
import { mockTTS } from './helpers/mockTTS'
import { mockVoicePreferences } from './helpers/mockVoicePreferences'
import { navigateToBook } from './helpers/navigateToBook'

// Early chapters are front matter (cover, copyright, etc.)
// Chapters 12+ are actual novel text with many paragraphs
const CHAPTER_A = 12
const CHAPTER_B = 13
const PARAGRAPH_INDEX = 1

const activeParagraph = (page: import('@playwright/test').Page) =>
  page.locator('main span.bg-amber-200\\/70')

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
  await mockProgress(page)
  await mockVoicePreferences(page)
  await mockSettings(page)
  await mockBookmarks(page)
  await navigateToBook(page)

  // Navigate to a text chapter (Cover is image-only)
  await selectChapter(page, CHAPTER_A)

  const target = allParagraphs(page).nth(PARAGRAPH_INDEX)
  await target.click()
  await expect(activeParagraph(page)).toBeVisible()

  const text = await activeParagraph(page).textContent()
  return text!
}

test.describe('chapter position preservation', () => {
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
