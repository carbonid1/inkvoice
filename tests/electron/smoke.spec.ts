import {
  _electron as electron,
  expect,
  test,
  type ElectronApplication,
  type Page,
} from '@playwright/test'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const DEFAULT_APP_PATH = path.resolve(
  __dirname,
  '../../dist/mac-arm64/InkVoice.app/Contents/MacOS/InkVoice',
)
const APP_PATH = process.env.INKVOICE_APP_PATH ?? DEFAULT_APP_PATH

const isInkVoiceRunning = (): boolean => {
  try {
    const result = execSync('pgrep -x InkVoice', { encoding: 'utf-8' })
    return result.trim().length > 0
  } catch {
    return false
  }
}

let app: ElectronApplication
let window: Page

test.describe('electron smoke', () => {
  test.beforeAll(async () => {
    test.skip(
      !fs.existsSync(APP_PATH),
      `Packaged app not found at ${APP_PATH} — run pnpm electron:build first`,
    )
    test.skip(
      isInkVoiceRunning(),
      'InkVoice is already running — quit it first (single-instance lock prevents concurrent launches)',
    )

    app = await electron.launch({ executablePath: APP_PATH })
    window = await app.firstWindow()
  })

  test.afterAll(async () => {
    await app?.close().catch(() => {})
  })

  test('loading screen renders', async () => {
    const url = window.url()
    expect(url).toContain('loading.html')

    await expect(window.locator('h1')).toHaveText('InkVoice')
    await expect(window.locator('.spinner')).toBeVisible()
    await expect(window.locator('.status')).toBeVisible()
  })

  test('servers start and library loads', async () => {
    await window.waitForURL(/http:\/\/127\.0\.0\.1:\d+/, { timeout: 170_000 })

    await expect(window.locator('h1').first()).toHaveText('InkVoice')
    await expect(window.getByText('Read and listen to your books')).toBeVisible()
  })

  test('navigate to settings', async () => {
    await window.getByRole('link', { name: 'Settings' }).click()
    await window.waitForURL(/\/settings/)

    await expect(window.locator('h1')).toHaveText('Settings')
  })
})
