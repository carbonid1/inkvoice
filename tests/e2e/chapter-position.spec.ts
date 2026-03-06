import { expect, test } from '@playwright/test'
import { mockBookmarks } from './helpers/mockBookmarks'
import { mockTTS } from './helpers/mockTTS'
import { navigateToBook } from './helpers/navigateToBook'

// Early chapters are front matter (cover, copyright, etc.)
// Chapters 12+ are actual novel text with many sentences
const CHAPTER_A = 12
const CHAPTER_B = 13
const SENTENCE_INDEX = 1

const activeSentence = (page: import('@playwright/test').Page) =>
  page.locator('main span.bg-amber-200\\/70')

const allSentences = (page: import('@playwright/test').Page) =>
  page.locator('main span.cursor-pointer')

const chapterButton = (page: import('@playwright/test').Page) =>
  page.locator('button[aria-label="Chapter"]')

const selectChapter = async (page: import('@playwright/test').Page, index: number) => {
  await chapterButton(page).click()
  const listbox = page.getByRole('listbox')
  await listbox.waitFor()
  await listbox.getByRole('option').nth(index).click()
  await allSentences(page).first().waitFor()
}

const setupAndClickSentence = async (page: import('@playwright/test').Page) => {
  await mockTTS(page)
  await mockBookmarks(page)
  await navigateToBook(page)

  // Navigate to a text chapter (Cover is image-only)
  await selectChapter(page, CHAPTER_A)

  const target = allSentences(page).nth(SENTENCE_INDEX)
  await target.click()
  await expect(activeSentence(page)).toBeVisible()

  const text = await activeSentence(page).textContent()
  return text!
}

test.describe('chapter position preservation', () => {
  test('preserves sentence position when switching chapters and returning', async ({ page }) => {
    const expectedText = await setupAndClickSentence(page)

    // Switch to a different chapter
    await selectChapter(page, CHAPTER_B)

    // Switch back to the original chapter
    await selectChapter(page, CHAPTER_A)

    // The previously selected sentence should still be highlighted
    await expect(activeSentence(page)).toBeVisible()
    await expect(activeSentence(page)).toHaveText(expectedText)
  })
})
