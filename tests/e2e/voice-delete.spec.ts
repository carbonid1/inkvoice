import { expect, test } from '@playwright/test'
import { mockVoiceManagement } from './helpers/mockVoiceManagement'

const navigateToSettings = async (page: import('@playwright/test').Page) => {
  const voicesResponse = page.waitForResponse(
    resp => resp.url().includes('/api/voices') && resp.status() === 200,
  )
  await page.goto('/settings')
  await voicesResponse
  await page.waitForSelector('[data-voice]')
}

/**
 * Custom voices can be removed from the settings page. Deletion is soft —
 * an undo toast (or Ctrl+Z) lets the reader recover immediately.
 */
test.describe('voice deletion', () => {
  /** Hovering a voice row reveals a remove button; clicking it hides the voice and shows an undo toast. */
  test('deleting a custom voice hides it and shows undo toast', async ({ page }) => {
    await mockVoiceManagement(page)
    await navigateToSettings(page)

    // Custom voice "Test Voice" should be visible
    await expect(page.getByText('Test Voice')).toBeVisible()

    // Hover the custom voice row to reveal the remove button
    const voiceRow = page.locator('[data-voice="test-voice"]')
    await voiceRow.hover()
    await page.getByRole('button', { name: 'Remove Test Voice' }).click()

    // Voice should disappear and toast should show
    await expect(page.getByText('Voice removed')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible()

    // The removed voice should no longer be visible
    await expect(page.locator('[data-voice="test-voice"]')).not.toBeVisible()
  })

  /** Clicking "Undo" in the toast brings the voice back into the list. */
  test('undo button restores deleted voice', async ({ page }) => {
    await mockVoiceManagement(page)
    await navigateToSettings(page)

    // Delete the custom voice
    const voiceRow = page.locator('[data-voice="test-voice"]')
    await voiceRow.hover()
    await page.getByRole('button', { name: 'Remove Test Voice' }).click()
    await expect(page.getByText('Voice removed')).toBeVisible()

    // Click Undo
    await page.getByRole('button', { name: 'Undo' }).click()

    // Voice should reappear
    await expect(page.locator('[data-voice="test-voice"]')).toBeVisible()
    await expect(page.getByText('Test Voice')).toBeVisible()
  })

  /** Ctrl+Z restores the voice, same as clicking the toast button. */
  test('Ctrl+Z restores deleted voice', async ({ page }) => {
    await mockVoiceManagement(page)
    await navigateToSettings(page)

    // Delete the custom voice
    const voiceRow = page.locator('[data-voice="test-voice"]')
    await voiceRow.hover()
    await page.getByRole('button', { name: 'Remove Test Voice' }).click()
    await expect(page.getByText('Voice removed')).toBeVisible()

    // Press Ctrl+Z
    await page.keyboard.press('ControlOrMeta+Z')

    // Voice should reappear
    await expect(page.locator('[data-voice="test-voice"]')).toBeVisible()
    await expect(page.getByText('Test Voice')).toBeVisible()
  })
})
