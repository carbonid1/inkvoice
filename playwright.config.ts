import { resolve } from 'node:path'
import { defineConfig, devices } from '@playwright/test'
import { E2E_DATA_DIR } from './tests/e2e/e2e.consts'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 0,
  workers: 1,
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npx tsx tests/e2e/mock-tts-server.ts',
      port: 8000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'npx next dev',
      port: 3000,
      stdout: 'ignore',
      stderr: 'pipe',
      env: {
        INKVOICE_BOOKS_DIR: resolve(E2E_DATA_DIR, 'books'),
        INKVOICE_VOICES_DIR: resolve(E2E_DATA_DIR, 'voices'),
        INKVOICE_CACHE_DIR: resolve(E2E_DATA_DIR, 'cache', 'tts'),
        INKVOICE_DB_PATH: resolve(E2E_DATA_DIR, 'test.db'),
        INKVOICE_TTS_API_URL: 'http://localhost:8000/tts',
      },
    },
  ],
})
