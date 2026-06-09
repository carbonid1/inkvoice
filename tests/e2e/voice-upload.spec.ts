import fs from 'fs'
import path from 'path'
import { expect, test, type Page } from '@playwright/test'
import { mockVoiceManagement } from './helpers/mockVoiceManagement'
import { navigateToSettings } from './helpers/navigateToSettings'

const uploadFixturePath = path.resolve(__dirname, '../fixtures/silence-10s.wav')

const setUploadFile = async (page: Page) => {
  const fileInput = page.locator('input[type="file"]')

  await fileInput.setInputFiles({
    name: 'recording.wav',
    mimeType: 'audio/wav',
    buffer: fs.readFileSync(uploadFixturePath),
  })
}

const openUploadForm = async (page: Page) => {
  await page.getByRole('button', { name: 'Upload voice' }).click()
}

/**
 * Readers can add custom TTS voices by uploading a WAV recording in settings.
 * The upload form validates inputs, shows progress, and the new voice appears
 * in the list with a generating sample indicator that becomes playable once ready.
 */
test.describe('voice upload', () => {
  /** The "Upload voice" button opens the form; the close (X) button collapses it. */
  test('Upload voice button toggles the upload form', async ({ page }) => {
    await mockVoiceManagement(page)
    await navigateToSettings(page)

    // Form should be hidden initially
    await expect(page.getByLabel('Voice name')).not.toBeVisible()

    // Open form
    await openUploadForm(page)
    await expect(page.getByLabel('Voice name')).toBeVisible()

    // Close form via the X button
    await page.getByRole('button', { name: 'Close upload form' }).click()
    await expect(page.getByLabel('Voice name')).not.toBeVisible()
  })

  /**
   * Upload validates the name field inline once a valid file is selected — clicking
   * Upload with an empty name surfaces "Voice name is required" and keeps the form open.
   * (The Upload button stays disabled until a 10–20s file is picked, so file-presence
   * is enforced by the button state itself, not by submit-time validation.)
   */
  test('validates voice name once a file is selected', async ({ page }) => {
    await mockVoiceManagement(page)
    await navigateToSettings(page)

    await openUploadForm(page)
    const uploadButton = page.getByRole('button', { name: 'Upload', exact: true })

    await expect(uploadButton).toBeDisabled()

    await setUploadFile(page)
    await expect(uploadButton).toBeEnabled()

    await uploadButton.click()
    await expect(page.getByText('Voice name is required')).toBeVisible()
    await expect(page.getByLabel('Voice name')).toBeVisible()
  })

  /**
   * After uploading, the transcription review step appears. Clicking Done fires the success toast,
   * collapses the form, and the new voice is present in the list both before and after Done —
   * guards against the "voice list stays stale after save" bug.
   */
  test('uploading a voice shows transcription review then keeps the voice after Done', async ({
    page,
  }) => {
    const { getUploadedVoices } = await mockVoiceManagement(page)

    await navigateToSettings(page)

    await openUploadForm(page)
    await page.getByLabel('Voice name').fill('New Voice')
    await setUploadFile(page)

    await page.getByRole('button', { name: 'Upload', exact: true }).click()

    // Transcription review step shows the source audio + a Done button
    // (Done flips to "Save voice" only when the transcription is edited)
    const doneButton = page.getByRole('button', { name: 'Done' })

    await expect(doneButton).toBeVisible()

    // New voice should already be in the list (first refetch fired on upload success)
    await expect(page.getByText('New Voice')).toBeVisible()

    await doneButton.click()

    // Toast + collapsed form after Done
    await expect(page.getByText('Voice uploaded')).toBeVisible()
    await expect(page.getByLabel('Voice name')).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Upload voice' })).toBeVisible()

    // Voice still present after the form collapses
    await expect(page.getByText('New Voice')).toBeVisible()
    expect(getUploadedVoices().map(v => v.displayName)).toContain('New Voice')
  })

  /** Uploading with a name that already exists shows an inline error and keeps the form open. */
  test('shows error for duplicate voice name', async ({ page }) => {
    await mockVoiceManagement(page)
    await navigateToSettings(page)

    await openUploadForm(page)
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

    await openUploadForm(page)
    await page.getByLabel('Voice name').fill('New Voice')
    await setUploadFile(page)
    await page.getByRole('button', { name: 'Upload', exact: true }).click()

    // The new voice row should have a disabled pulsing sample button
    const sampleButton = page.getByRole('button', { name: /Generating sample for New Voice/ })

    await expect(sampleButton).toBeVisible()
    await expect(sampleButton).toBeDisabled()
  })

  /** Pressing Enter in the name field submits the upload, same as clicking the Upload button. */
  test('Enter key triggers upload', async ({ page }) => {
    await mockVoiceManagement(page)
    await navigateToSettings(page)

    await openUploadForm(page)
    await page.getByLabel('Voice name').fill('Enter Voice')
    await setUploadFile(page)

    // Wait for the audio duration to be computed — browsers won't implicit-submit
    // while the only submit button is disabled.
    await expect(page.getByRole('button', { name: 'Upload', exact: true })).toBeEnabled()

    // Press Enter in the name field — triggers upload and opens transcription review
    await page.getByLabel('Voice name').press('Enter')
    await expect(page.getByRole('button', { name: 'Done' })).toBeVisible()
  })

  /** Once the server finishes generating the sample, the button becomes playable. */
  test('sample button becomes interactive when sample is ready', async ({ page }) => {
    const { markSampleReady } = await mockVoiceManagement(page)

    await navigateToSettings(page)

    await openUploadForm(page)
    await page.getByLabel('Voice name').fill('New Voice')
    await setUploadFile(page)
    await page.getByRole('button', { name: 'Upload', exact: true }).click()

    // Verify pulsing state first
    await expect(
      page.getByRole('button', { name: /Generating sample for New Voice/ }),
    ).toBeVisible()

    // Mark sample as ready — the SSE stream announces it and the client refetches
    markSampleReady('new-voice')

    // Button should become interactive after the voice list refetch
    const playButton = page.getByRole('button', { name: /Play voice sample for New Voice/ })

    await expect(playButton).toBeVisible({ timeout: 10000 })
    await expect(playButton).toBeEnabled()
  })
})
