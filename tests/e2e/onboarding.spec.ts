import { expect, test } from '@playwright/test'
import { cleanupOnboarding } from './helpers/cleanupOnboarding'
import { cleanupPregenJobs } from './helpers/pregenCleanup'
import { selectDifferentVoice } from './helpers/selectDifferentVoice'
import { TEST_BOOK_ID } from './helpers/testBook'

/**
 * The Library "Get started" checklist nudges new users toward the two things
 * that make playback feel finished: pick a voice and pre-generate audio.
 * Each step ticks live as the user does it; once both are done the panel
 * vanishes for good. Dismissal is permanent across reloads.
 */
test.describe('onboarding', () => {
  test.setTimeout(60_000)

  test.beforeEach(async ({ request }) => {
    await cleanupPregenJobs(request)
    await cleanupOnboarding(request)
  })

  /**
   * Walks the full gestalt: fresh load shows "0 of 2", picking a non-default
   * voice ticks to "1 of 2", the pregen action opens the inline panel on the
   * book page, Start generation fires the job and closes the panel, and the
   * checklist no longer renders on the Library — even after a hard reload.
   */
  test('completing each step ticks the checklist and hides it once both are done', async ({
    page,
  }) => {
    await page.goto('/')

    const heading = page.getByRole('heading', { name: 'Get started' })

    await expect(heading).toBeVisible()
    await expect(page.getByText('0 of 2')).toBeVisible()

    // Voice step — jump to settings, pick a non-default voice, return
    await page.getByRole('link', { name: /Choose voice/ }).click()
    await page.waitForURL(/\/settings/)
    await selectDifferentVoice(page)

    await page.goto('/')
    await expect(heading).toBeVisible()
    await expect(page.getByText('1 of 2')).toBeVisible()

    // Pregen step — follow the action into the inline panel
    await page.getByRole('link', { name: /Open a book/ }).click()
    await page.waitForURL(new RegExp(`/book/${TEST_BOOK_ID}\\?onboarding=pregen`))

    const panelHeading = page.getByRole('heading', { name: /^Pre-generate/ })

    await expect(panelHeading).toBeVisible()

    const startButton = page.getByRole('button', { name: 'Start generation' })

    await expect(startButton).toBeEnabled({ timeout: 15_000 })
    await startButton.click()

    await expect(page.getByText('Generation started')).toBeVisible()
    await expect(panelHeading).not.toBeVisible()

    // Both steps done → checklist no longer renders
    await page.goto('/')
    await expect(page.locator('a[href^="/book/"]').first()).toBeVisible()
    await expect(heading).not.toBeVisible()

    await page.reload()
    await expect(page.locator('a[href^="/book/"]').first()).toBeVisible()
    await expect(heading).not.toBeVisible()
  })

  /** Dismissing the checklist with the X button hides it permanently. */
  test('dismiss persists across reload', async ({ page }) => {
    await page.goto('/')

    const heading = page.getByRole('heading', { name: 'Get started' })

    await expect(heading).toBeVisible()

    const dismissResponse = page.waitForResponse(
      resp =>
        resp.url().includes('/api/settings/onboarding.dismissed') &&
        resp.request().method() === 'PUT',
    )

    await page.getByRole('button', { name: 'Dismiss getting started permanently' }).click()
    await dismissResponse
    await expect(heading).not.toBeVisible()

    await page.reload()
    await expect(page.locator('a[href^="/book/"]').first()).toBeVisible()
    await expect(heading).not.toBeVisible()
  })
})
