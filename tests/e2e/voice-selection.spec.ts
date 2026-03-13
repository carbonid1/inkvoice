import { expect, test } from '@playwright/test'
import { mockProgress } from './helpers/mockProgress'
import { mockSettings } from './helpers/mockSettings'
import { mockTTS } from './helpers/mockTTS'
import { mockVoicePreferences } from './helpers/mockVoicePreferences'
import { navigateToBook } from './helpers/navigateToBook'

test.describe('per-book voice selection', () => {
  test('click-to-select voice in settings and verify book page reflects it', async ({ page }) => {
    await mockTTS(page)
    await mockProgress(page)
    await mockVoicePreferences(page)
    await mockSettings(page)

    // 1. Go to settings, find the currently selected voice row
    await page.goto('/settings')
    const selectedRow = page.locator('button[aria-current="true"]')
    await selectedRow.waitFor()

    // 2. Click a different voice to select it
    const allVoiceButtons = page.locator('button[data-voice]')
    const count = await allVoiceButtons.count()
    let targetRow = null
    let newVoiceName = ''

    for (let i = 0; i < count; i++) {
      const btn = allVoiceButtons.nth(i)
      const isCurrent = await btn.getAttribute('aria-current')
      if (isCurrent !== 'true') {
        targetRow = btn
        newVoiceName = (await btn.locator('.font-medium.truncate').textContent()) ?? ''
        break
      }
    }

    expect(targetRow).not.toBeNull()
    await targetRow!.click()

    // 3. Verify the clicked row is now selected
    await expect(page.locator('button[aria-current="true"]')).toContainText(newVoiceName)

    // 4. Navigate to a book
    await navigateToBook(page)

    // 5. Book voice selector should show "Default (<newVoiceName>)"
    const bookVoiceButton = page.getByRole('button', { name: 'Voice' })
    await bookVoiceButton.waitFor()
    await expect(bookVoiceButton).toContainText(`Default (${newVoiceName})`)

    // 6. Override voice at book level
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

    // 7. Return to settings — selected voice should be unchanged
    await page.goto('/settings')
    const selectedAfter = page.locator('button[aria-current="true"]')
    await selectedAfter.waitFor()
    await expect(selectedAfter).toContainText(newVoiceName)
  })
})
