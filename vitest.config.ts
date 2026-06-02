import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['**/*.test.{ts,tsx}'],
          exclude: ['**/*.integration.test.{ts,tsx}', '**/node_modules/**'],
          environment: 'jsdom',
          setupFiles: ['./src/test/setup.ts'],
          // @carbonid1/design-system ships an ESM build with extensionless
          // relative imports (export … from './Badge/Badge'). Node's native ESM
          // resolver rejects those, so the externalized dep crashes any unit test
          // that transitively imports it. Inlining routes it through Vite's
          // resolver (which fills in the extension) until the package ships a
          // spec-compliant build.
          server: {
            deps: {
              inline: [/@carbonid1\/design-system/],
            },
          },
        },
      },
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
            storybookScript: 'pnpm storybook --ci',
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
