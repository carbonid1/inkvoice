import { expect, test } from '@playwright/test'
import { mockTTS } from './helpers/mockTTS'
import { navigateToBook } from './helpers/navigateToBook'

test.describe('per-book voice selection', () => {
  test('book voice selector shows global default and supports per-book override', async ({
    page,
  }) => {
    await mockTTS(page)

    // 1. Go to settings, pick a voice via custom dropdown
    await page.goto('/settings')
    const globalButton = page.locator('#voice-select')
    await globalButton.waitFor()
    const initialVoice = (await globalButton.textContent()) ?? ''

    // Open dropdown and pick a different voice
    await globalButton.click()
    const listbox = page.getByRole('listbox')
    await listbox.waitFor()
    const options = await listbox.getByRole('option').all()

    let alternateOption = null
    for (const option of options) {
      const text = (await option.textContent()) ?? ''
      if (text && !text.includes(initialVoice)) {
        alternateOption = option
        break
      }
    }

    if (alternateOption) {
      await alternateOption.click()
    }

    const newGlobalVoice = (await globalButton.textContent()) ?? ''

    // 2. Navigate to a book
    await navigateToBook(page)

    // 3. Book voice selector should show "Default (...)" text
    const bookVoiceButton = page.getByRole('button', { name: 'Voice' })
    await bookVoiceButton.waitFor()
    await expect(bookVoiceButton).toContainText(`Default (${newGlobalVoice})`)

    // 4. Override voice at book level — open dropdown, pick a non-default voice
    await bookVoiceButton.click()
    const bookListbox = page.getByRole('listbox')
    await bookListbox.waitFor()
    const bookOptions = await bookListbox.getByRole('option').all()

    let overrideOption = null
    for (const option of bookOptions) {
      const text = (await option.textContent()) ?? ''
      if (!text.includes('Default') && !text.includes(newGlobalVoice)) {
        overrideOption = option
        break
      }
    }

    if (overrideOption) {
      const overrideName = (await overrideOption.locator('span').first().textContent()) ?? ''
      await overrideOption.click()
      // Button should now show the overridden voice name, not "Default"
      await expect(bookVoiceButton).toContainText(overrideName)
    }

    // 5. Go back to settings — global voice should be unchanged
    await page.goto('/settings')
    const globalButtonAfter = page.locator('#voice-select')
    await globalButtonAfter.waitFor()
    await expect(globalButtonAfter).toHaveText(newGlobalVoice)
  })
})
