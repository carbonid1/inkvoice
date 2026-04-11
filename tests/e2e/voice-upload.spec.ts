import { expect, test } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { mockVoiceManagement } from './helpers/mockVoiceManagement'
import { navigateToSettings } from './helpers/navigateToSettings'

const uploadFixturePath = path.resolve(__dirname, '../fixtures/silence-10s.wav')

const setUploadFile = async (page: import('@playwright/test').Page) => {
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles({
    name: 'recording.wav',
    mimeType: 'audio/wav',
    buffer: fs.readFileSync(uploadFixturePath),
  })
}

/**
 * Readers can add custom TTS voices by uploading a WAV recording in settings.
 * The upload form validates inputs, shows progress, and the new voice appears
 * in the list with a generating sample indicator that becomes playable once ready.
 */
test.describe('voice upload', () => {
  /** The upload form toggles open and closed via the "Add Voice" / "Hide Upload" button. */
  test('Add Voice button toggles the upload form', async ({ page }) => {
    await mockVoiceManagement(page)
    await navigateToSettings(page)

    // Form should be hidden initially
    await expect(page.getByLabel('Voice name')).not.toBeVisible()

    // Open form
    await page.getByText('Add Voice').click()
    await expect(page.getByLabel('Voice name')).toBeVisible()
    await expect(page.getByText('Hide Upload')).toBeVisible()

    // Close form
    await page.getByText('Hide Upload').click()
    await expect(page.getByLabel('Voice name')).not.toBeVisible()
  })

  /** Upload validates required fields inline — clicking Upload without a name or file shows errors instead of submitting. */
  test('validates required fields before submitting', async ({ page }) => {
    await mockVoiceManagement(page)
    await navigateToSettings(page)

    await page.getByText('Add Voice').click()
    const uploadButton = page.getByRole('button', { name: 'Upload', exact: true })

    // Both empty — clicking Upload reports the missing name and keeps the form open
    await uploadButton.click()
    await expect(page.getByText('Voice name is required')).toBeVisible()
    await expect(page.getByLabel('Voice name')).toBeVisible()

    // Name only — clicking Upload reports the missing file
    await page.getByLabel('Voice name').fill('My Voice')
    await uploadButton.click()
    await expect(page.getByText('Audio file is required')).toBeVisible()
  })

  /**
   * After uploading, the transcription review step appears. Clicking Save fires the success toast,
   * collapses the form, and the new voice is present in the list both before and after Save —
   * guards against the "voice list stays stale after Save" bug.
   */
  test('uploading a voice shows transcription review then adds the voice after Save', async ({
    page,
  }) => {
    const { getUploadedVoices } = await mockVoiceManagement(page)
    await navigateToSettings(page)

    await page.getByText('Add Voice').click()
    await page.getByLabel('Voice name').fill('New Voice')
    await setUploadFile(page)

    await page.getByRole('button', { name: 'Upload', exact: true }).click()

    // Transcription review step should appear with a Save button
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()

    // New voice should already be in the list (first refetch fired on upload success)
    await expect(page.getByText('New Voice')).toBeVisible()

    await page.getByRole('button', { name: 'Save' }).click()

    // Toast + collapsed form after Save
    await expect(page.getByText('Voice added')).toBeVisible()
    await expect(page.getByText('Open a book to start listening')).toBeVisible()
    await expect(page.getByLabel('Voice name')).not.toBeVisible()
    await expect(page.getByText('Add Voice')).toBeVisible()

    // Voice still present after the form collapses
    await expect(page.getByText('New Voice')).toBeVisible()
    expect(getUploadedVoices().map(v => v.displayName)).toContain('New Voice')
  })

  /** Uploading with a name that already exists shows an inline error and keeps the form open. */
  test('shows error for duplicate voice name', async ({ page }) => {
    await mockVoiceManagement(page)
    await navigateToSettings(page)

    await page.getByText('Add Voice').click()
    // "Test Voice" already exists as a custom voice in the mock
    await page.getByLabel('Voice name').fill('Test Voice')
    await setUploadFile(page)

    await page.getByRole('button', { name: 'Upload', exact: true }).click()

    // Error should be visible
    await expect(page.getByText('Voice name already taken')).toBeVisible()

    // Form should stay open
    await expect(page.getByLabel('Voice name')).toBeVisible()
  })

  /** A freshly uploaded voice shows a pulsing disabled sample button while the sample is being generated. */
  test('newly uploaded voice shows pulsing sample button', async ({ page }) => {
    await mockVoiceManagement(page)
    await navigateToSettings(page)

    await page.getByText('Add Voice').click()
    await page.getByLabel('Voice name').fill('New Voice')
    await setUploadFile(page)
    await page.getByRole('button', { name: 'Upload', exact: true }).click()

    // The new voice row should have a disabled pulsing sample button
    const sampleButton = page.getByRole('button', { name: /Generating sample for New Voice/ })
    await expect(sampleButton).toBeVisible()
    await expect(sampleButton).toBeDisabled()
  })

  /** Once the server finishes generating the sample, the button becomes playable. */
  test('sample button becomes interactive when sample is ready', async ({ page }) => {
    const { markSampleReady } = await mockVoiceManagement(page)
    await navigateToSettings(page)

    await page.getByText('Add Voice').click()
    await page.getByLabel('Voice name').fill('New Voice')
    await setUploadFile(page)
    await page.getByRole('button', { name: 'Upload', exact: true }).click()

    // Verify pulsing state first
    await expect(
      page.getByRole('button', { name: /Generating sample for New Voice/ }),
    ).toBeVisible()

    // Mark sample as ready — polling will pick it up
    markSampleReady('new-voice')

    // Button should become interactive (polling refetches voice list)
    const playButton = page.getByRole('button', { name: /Play voice sample for New Voice/ })
    await expect(playButton).toBeVisible({ timeout: 10000 })
    await expect(playButton).toBeEnabled()
  })

  /** Pressing Enter in the name field submits the upload, same as clicking the Upload button. */
  test('Enter key triggers upload', async ({ page }) => {
    await mockVoiceManagement(page)
    await navigateToSettings(page)

    await page.getByText('Add Voice').click()
    await page.getByLabel('Voice name').fill('Enter Voice')
    await setUploadFile(page)

    // Press Enter in the name field — triggers upload and opens transcription review
    await page.getByLabel('Voice name').press('Enter')
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()

    // Save to get the confirmation toast
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Voice added')).toBeVisible()
  })
})
