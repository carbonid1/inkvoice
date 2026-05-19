import { expect, test } from '@playwright/test'
import { cleanupPregenJobs } from './helpers/pregenCleanup'
import { TEST_BOOK_ID } from './helpers/testBook'

/**
 * Pre-generation lets readers generate TTS audio for an entire book ahead of time,
 * so playback works from cache without on-demand synthesis.
 *
 * This spec intentionally hits the real TTS API (no mockTTS) — it tests the actual
 * generation pipeline end-to-end, including server communication and progress tracking.
 */
test.describe('pre-generation', () => {
  test.setTimeout(60_000)

  test.beforeEach(async ({ request }) => {
    await cleanupPregenJobs(request)
  })

  test('pre-generates a book from context menu and completes', async ({ page }) => {
    await page.goto('/')

    const bookCard = page.locator(`a[href="/book/${TEST_BOOK_ID}"]`)

    await expect(bookCard).toBeVisible()

    // Start pre-generation
    await bookCard.click({ button: 'right' })
    const menu = page.locator('[role="menu"]')

    await expect(menu).toBeVisible()
    await menu.locator('[role="menuitem"]', { hasText: 'Pre-generate Audio' }).click()

    // Starting generation surfaces the progress panel automatically
    await expect(page.getByRole('heading', { name: 'Generation Queue' })).toBeVisible()

    // Wait for generation to complete (may pass through Queued/Generating states too fast to observe)
    const ring = bookCard.locator('svg[role="img"]')

    await expect(ring).toHaveAttribute('aria-label', /^\d+ paragraphs/, { timeout: 30_000 })
  })
})
