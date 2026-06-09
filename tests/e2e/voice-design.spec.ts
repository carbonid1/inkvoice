import { expect, test, type Locator, type Page } from '@playwright/test'
import { mockVoiceManagement } from './helpers/mockVoiceManagement'
import { navigateToSettings } from './helpers/navigateToSettings'

const openDesignForm = async (page: Page) => {
  await page.getByRole('button', { name: 'Design with AI' }).click()
}

// Tooltip wrappers replace the buttons' accessible names, so target by text content.
const generateButton = (page: Page): Locator =>
  page.getByRole('button').filter({ hasText: /^Generate$/ })
const saveVoiceButton = (page: Page): Locator =>
  page.getByRole('button').filter({ hasText: /^Save voice$/ })

/**
 * Readers can synthesize a brand-new voice from speaker attributes (no audio sample required).
 * The form lets them pick characteristics, generate previews, and save the last preview as a voice.
 */
test.describe('voice design', () => {
  /** The "Design with AI" button opens the design form; the close (X) button collapses it. */
  test('Design with AI button toggles the design form', async ({ page }) => {
    await mockVoiceManagement(page)
    await navigateToSettings(page)

    await expect(page.getByRole('switch', { name: 'Whisper' })).not.toBeVisible()

    await openDesignForm(page)
    await expect(page.getByRole('switch', { name: 'Whisper' })).toBeVisible()

    // Save voice is disabled until at least one preview is generated.
    const saveButton = saveVoiceButton(page)

    await expect(saveButton).toBeVisible()
    await expect(saveButton).toBeDisabled()

    await page.getByRole('button', { name: 'Close', exact: true }).click()
    await expect(page.getByRole('switch', { name: 'Whisper' })).not.toBeVisible()
  })

  /** Generating with no characteristics picked is allowed — the model improvises freely. */
  test('Generate works without picking any characteristic', async ({ page }) => {
    await mockVoiceManagement(page)
    await navigateToSettings(page)

    await openDesignForm(page)

    await generateButton(page).click()
    // Save enables only once a preview take exists, i.e. generation succeeded.
    await expect(saveVoiceButton(page)).toBeEnabled({ timeout: 10000 })
  })

  /**
   * Designing a voice end-to-end: toggle a characteristic, generate, save —
   * the success toast fires, the form collapses, and the new voice appears in the list.
   */
  test('design + save adds the voice to the list', async ({ page }) => {
    const { getDesignedVoices } = await mockVoiceManagement(page)

    await navigateToSettings(page)

    await openDesignForm(page)

    await page.getByRole('switch', { name: 'Whisper' }).click()
    await generateButton(page).click()

    const saveButton = saveVoiceButton(page)

    await expect(saveButton).toBeEnabled({ timeout: 10000 })

    const voiceName = (await page.getByLabel('Name', { exact: true }).inputValue()).trim()

    expect(voiceName.length).toBeGreaterThan(0)

    await saveButton.click()

    await expect(page.getByText('Voice designed')).toBeVisible()
    await expect(page.getByRole('switch', { name: 'Whisper' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Design with AI' })).toBeVisible()

    expect(getDesignedVoices().map(v => v.displayName)).toContain(voiceName)
    await expect(page.getByText(voiceName).first()).toBeVisible()
  })
})
