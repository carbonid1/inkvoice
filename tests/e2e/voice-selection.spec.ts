import { expect, test } from '@playwright/test'
import { mockProgress } from './helpers/mockProgress'
import { mockSettings } from './helpers/mockSettings'
import { mockTTS } from './helpers/mockTTS'
import { mockVoicePreferences } from './helpers/mockVoicePreferences'
import { navigateToBook } from './helpers/navigateToBook'
import { selectDifferentVoice } from './helpers/selectDifferentVoice'

test.describe('per-book voice selection', () => {
  test('click-to-select voice in settings and verify book page reflects it', async ({ page }) => {
    await mockTTS(page)
    await mockProgress(page)
    await mockVoicePreferences(page)
    await mockSettings(page)

    // 1. Go to settings and select a different voice
    await page.goto('/settings')
    const newVoiceName = await selectDifferentVoice(page)

    // 2. Navigate to a book
    await navigateToBook(page)

    // 3. Book voice selector should show "Default (<newVoiceName>)"
    const bookVoiceButton = page.getByRole('button', { name: 'Voice' })
    await bookVoiceButton.waitFor()
    await expect(bookVoiceButton).toContainText(`Default (${newVoiceName})`)

    // 4. Override voice at book level
    await bookVoiceButton.click()
    const bookListbox = page.getByRole('listbox')
    await bookListbox.waitFor()
    const bookOptions = await bookListbox.getByRole('option').all()

    let overrideOption = null
    for (const option of bookOptions) {
      const text = (await option.textContent()) ?? ''
      if (!text.includes('Default') && !text.includes(newVoiceName)) {
        overrideOption = option
        break
      }
    }

    if (overrideOption) {
      const overrideName = (await overrideOption.locator('span').first().textContent()) ?? ''
      await overrideOption.click()
      await expect(bookVoiceButton).toContainText(overrideName)
    }

    // 5. Return to settings — selected voice should be unchanged
    await page.goto('/settings')
    const selectedAfter = page.locator('button[aria-current="true"]')
    await selectedAfter.waitFor()
    await expect(selectedAfter).toContainText(newVoiceName)
  })

  test('selected voice persists across page refresh', async ({ page }) => {
    await mockTTS(page)
    await mockProgress(page)
    await mockVoicePreferences(page)
    await mockSettings(page)

    // 1. Go to settings, select a different voice
    await page.goto('/settings')
    const newVoiceName = await selectDifferentVoice(page)

    // 2. Reload the page
    await page.reload()

    // 3. Verify the voice is still selected after refresh
    const selectedAfterRefresh = page.locator('button[aria-current="true"]')
    await selectedAfterRefresh.waitFor()
    await expect(selectedAfterRefresh).toContainText(newVoiceName)
  })
})
