import { expect, test } from '@playwright/test'
import { mockTTS } from './helpers/mockTTS'

test.describe('TTS prefetching', () => {
  test('navigating to a book triggers TTS prefetch requests', async ({ page }) => {
    const ttsRequests: string[] = []

    await mockTTS(page)

    // Track TTS requests before they're intercepted
    page.on('request', req => {
      if (req.url().includes('/api/tts/')) {
        ttsRequests.push(req.url())
      }
    })

    // Go to library, click first book
    await page.goto('/')
    await page.waitForSelector('a[href^="/book/"]')
    const firstBook = page.locator('a[href^="/book/"]').first()
    await firstBook.click()

    // Wait for book page to load (title appears in header)
    await page.waitForSelector('header h1')

    // Click play to trigger audio fetching
    const playButton = page.getByRole('button', { name: /play/i })
    if (await playButton.isVisible()) {
      await playButton.click()
    }

    // Wait for at least one TTS request
    await expect
      .poll(() => ttsRequests.length, {
        message: 'Expected at least one TTS prefetch request',
        timeout: 10_000,
      })
      .toBeGreaterThan(0)
  })

  test('navigating away from book stops TTS requests', async ({ page }) => {
    await mockTTS(page)

    // Navigate to first book
    await page.goto('/')
    await page.waitForSelector('a[href^="/book/"]')
    await page.locator('a[href^="/book/"]').first().click()
    await page.waitForSelector('header h1')

    // Click play
    const playButton = page.getByRole('button', { name: /play/i })
    if (await playButton.isVisible()) {
      await playButton.click()
    }

    // Wait for initial TTS activity
    await page.waitForTimeout(1000)

    // Navigate back to library
    await page.locator('a[href="/"]').first().click()
    await page.waitForSelector('text=InkVoice')

    // Track requests after navigating away
    const requestsAfterLeave: string[] = []
    page.on('request', req => {
      if (req.url().includes('/api/tts/')) {
        requestsAfterLeave.push(req.url())
      }
    })

    // Wait and verify no new TTS requests
    await page.waitForTimeout(2000)
    expect(requestsAfterLeave).toHaveLength(0)
  })
})
