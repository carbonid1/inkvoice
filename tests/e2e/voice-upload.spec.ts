import { expect, test } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { mockSettings } from './helpers/mockSettings'
import { mockVoiceManagement } from './helpers/mockVoiceManagement'
import { mockVoicePreferences } from './helpers/mockVoicePreferences'

const uploadFixturePath = path.resolve(__dirname, '../fixtures/silence-10s.wav')

const navigateToSettings = async (page: import('@playwright/test').Page) => {
  const voicesResponse = page.waitForResponse(
    resp => resp.url().includes('/api/voices') && resp.status() === 200,
  )
  await page.goto('/settings')
  await voicesResponse
  await page.waitForSelector('[data-voice]')
}

const setUploadFile = async (page: import('@playwright/test').Page) => {
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles({
    name: 'recording.wav',
    mimeType: 'audio/wav',
    buffer: fs.readFileSync(uploadFixturePath),
  })
}

test.describe('voice upload', () => {
  test('Add Voice button toggles the upload form', async ({ page }) => {
    await mockVoiceManagement(page)
    await mockVoicePreferences(page)
    await mockSettings(page)
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

  test('Upload button is disabled without name or file', async ({ page }) => {
    await mockVoiceManagement(page)
    await mockVoicePreferences(page)
    await mockSettings(page)
    await navigateToSettings(page)

    await page.getByText('Add Voice').click()
    const uploadButton = page.getByRole('button', { name: 'Upload', exact: true })

    // Both empty — disabled
    await expect(uploadButton).toBeDisabled()

    // Name only — still disabled
    await page.getByLabel('Voice name').fill('My Voice')
    await expect(uploadButton).toBeDisabled()

    // File only — still disabled
    await page.getByLabel('Voice name').fill('')
    await setUploadFile(page)
    await expect(uploadButton).toBeDisabled()

    // Both filled — enabled (wait for async duration check)
    await page.getByLabel('Voice name').fill('My Voice')
    await expect(uploadButton).toBeEnabled()
  })

  test('uploading a voice shows success toast and collapses form', async ({ page }) => {
    const { getUploadedVoices } = await mockVoiceManagement(page)
    await navigateToSettings(page)

    await page.getByText('Add Voice').click()
    await page.getByLabel('Voice name').fill('New Voice')
    await setUploadFile(page)

    const uploadButton = page.getByRole('button', { name: 'Upload', exact: true })
    await expect(uploadButton).toBeEnabled()
    await uploadButton.click()

    // Success toast should appear
    await expect(page.getByText('Voice added')).toBeVisible()
    await expect(page.getByText('Open a book to start listening')).toBeVisible()

    // Form should collapse
    await expect(page.getByLabel('Voice name')).not.toBeVisible()
    await expect(page.getByText('Add Voice')).toBeVisible()

    // Voice should appear in the list under "Your Voices"
    await expect(page.getByText('New Voice')).toBeVisible()
    expect(getUploadedVoices().map(v => v.displayName)).toContain('New Voice')
  })

  test('shows error for duplicate voice name', async ({ page }) => {
    await mockVoiceManagement(page)
    await mockVoicePreferences(page)
    await mockSettings(page)
    await navigateToSettings(page)

    await page.getByText('Add Voice').click()
    // "Test Voice" already exists as a custom voice in the mock
    await page.getByLabel('Voice name').fill('Test Voice')
    await setUploadFile(page)

    const uploadButton = page.getByRole('button', { name: 'Upload', exact: true })
    await expect(uploadButton).toBeEnabled()
    await uploadButton.click()

    // Error should be visible
    await expect(page.getByText('Voice name already taken')).toBeVisible()

    // Form should stay open
    await expect(page.getByLabel('Voice name')).toBeVisible()
  })

  test('newly uploaded voice shows pulsing sample button', async ({ page }) => {
    await mockVoiceManagement(page)
    await mockVoicePreferences(page)
    await mockSettings(page)
    await navigateToSettings(page)

    await page.getByText('Add Voice').click()
    await page.getByLabel('Voice name').fill('New Voice')
    await setUploadFile(page)

    const uploadButton = page.getByRole('button', { name: 'Upload', exact: true })
    await expect(uploadButton).toBeEnabled()
    await uploadButton.click()

    // The new voice row should have a disabled pulsing sample button
    const sampleButton = page.getByRole('button', { name: /Generating sample for New Voice/ })
    await expect(sampleButton).toBeVisible()
    await expect(sampleButton).toBeDisabled()
  })

  test('sample button becomes interactive when sample is ready', async ({ page }) => {
    const { markSampleReady } = await mockVoiceManagement(page)
    await navigateToSettings(page)

    await page.getByText('Add Voice').click()
    await page.getByLabel('Voice name').fill('New Voice')
    await setUploadFile(page)

    const uploadButton = page.getByRole('button', { name: 'Upload', exact: true })
    await expect(uploadButton).toBeEnabled()
    await uploadButton.click()

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

  test('Enter key triggers upload', async ({ page }) => {
    await mockVoiceManagement(page)
    await mockVoicePreferences(page)
    await mockSettings(page)
    await navigateToSettings(page)

    await page.getByText('Add Voice').click()
    await page.getByLabel('Voice name').fill('Enter Voice')
    await setUploadFile(page)

    // Wait for duration check to complete and button to be enabled
    const uploadButton = page.getByRole('button', { name: 'Upload', exact: true })
    await expect(uploadButton).toBeEnabled()

    // Press Enter in the name field
    await page.getByLabel('Voice name').press('Enter')

    // Should trigger upload and show toast
    await expect(page.getByText('Voice added')).toBeVisible()
  })
})
