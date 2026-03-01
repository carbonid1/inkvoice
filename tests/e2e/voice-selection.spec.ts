import { expect, test } from '@playwright/test'
import { mockTTS } from './helpers/mockTTS'
import { navigateToBook } from './helpers/navigateToBook'

test.describe('per-book voice selection', () => {
  test('book voice selector shows global default and supports per-book override', async ({
    page,
  }) => {
    await mockTTS(page)

    // 1. Go to settings, set global voice
    await page.goto('/settings')
    const globalSelect = page.locator('#voice-select')
    await globalSelect.waitFor()
    const globalVoice = await globalSelect.inputValue()

    // Pick a different voice as global default
    const allOptions = await globalSelect.locator('option').all()
    const optionValues = await Promise.all(allOptions.map(o => o.getAttribute('value')))
    const alternateValue = optionValues.find(v => v && v !== globalVoice)
    if (alternateValue) {
      await globalSelect.selectOption(alternateValue)
    }
    const newGlobalVoice = await globalSelect.inputValue()
    const newGlobalDisplayName = await globalSelect
      .locator(`option[value="${newGlobalVoice}"]`)
      .textContent()

    // 2. Navigate to a book
    await navigateToBook(page)

    // 3. Voice selector should show "Default ({displayName})" as selected
    const bookVoiceSelect = page.getByRole('combobox', { name: 'Voice' })
    await bookVoiceSelect.waitFor()
    const selectedValue = await bookVoiceSelect.inputValue()
    expect(selectedValue).toBe('__default__')
    await expect(bookVoiceSelect.locator('option[value="__default__"]')).toContainText(
      `Default (${newGlobalDisplayName})`,
    )

    // 4. Override voice at book level
    const bookOptions = await bookVoiceSelect.locator('option').all()
    const bookOptionValues = await Promise.all(bookOptions.map(o => o.getAttribute('value')))
    const overrideValue = bookOptionValues.find(
      v => v && v !== '__default__' && v !== newGlobalVoice,
    )
    if (overrideValue) {
      await bookVoiceSelect.selectOption(overrideValue)
      const overriddenValue = await bookVoiceSelect.inputValue()
      expect(overriddenValue).not.toBe('__default__')
    }

    // 5. Go back to settings — global voice should be unchanged
    await page.goto('/settings')
    const globalSelectAfter = page.locator('#voice-select')
    await globalSelectAfter.waitFor()
    const globalVoiceAfter = await globalSelectAfter.inputValue()
    expect(globalVoiceAfter).toBe(newGlobalVoice)
  })
})
