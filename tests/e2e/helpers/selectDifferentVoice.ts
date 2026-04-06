import { expect, type Page } from '@playwright/test'

export const selectDifferentVoice = async (page: Page): Promise<string> => {
  const allVoiceButtons = page.locator('button[data-voice]')
  await allVoiceButtons.first().waitFor()

  const count = await allVoiceButtons.count()

  for (let i = 0; i < count; i++) {
    const btn = allVoiceButtons.nth(i)
    const isCurrent = await btn.getAttribute('aria-current')
    if (isCurrent !== 'true') {
      const name = (await btn.locator('[data-voice-name]').textContent()) ?? ''
      // Fire-and-forget PUT can lose to the next navigation, causing a stale read on the book page
      const prefResponse = page.waitForResponse(
        resp => resp.url().includes('/api/voice-preferences/') && resp.request().method() === 'PUT',
      )
      await btn.click()
      await prefResponse
      await expect(page.locator('button[aria-current="true"]')).toContainText(name)
      return name
    }
  }

  throw new Error('No unselected voice found')
}
