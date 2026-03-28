import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/electron',
  timeout: 180_000,
  retries: 0,
  use: {
    trace: 'retain-on-failure',
  },
})
