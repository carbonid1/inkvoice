import { expect, type Page } from '@playwright/test'

export const selectDifferentVoice = async (page: Page): Promise<string> => {
  const allVoiceButtons = page.locator('button[data-voice]')
  await allVoiceButtons.first().waitFor()

  const count = await allVoiceButtons.count()

  for (let i = 0; i < count; i++) {
    const btn = allVoiceButtons.nth(i)
    const isCurrent = await btn.getAttribute('aria-current')
    if (isCurrent !== 'true') {
      const name = (await btn.locator('.font-medium').textContent()) ?? ''
      await btn.click()
      await expect(page.locator('button[aria-current="true"]')).toContainText(name)
      return name
    }
  }

  throw new Error('No unselected voice found')
}
