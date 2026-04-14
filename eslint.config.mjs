import sharedConfig from '@carbonid1/eslint-config/nextjs'
import { globalIgnores } from 'eslint/config'

const config = [
  ...sharedConfig,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'venv/**',
    'api/**',
    'data/**',
    'generated/**',
    'storybook-static/**',
    'electron/**',
    'dist-electron/**',
    'scripts/after-pack.js',
    'dist/**',
    'dist-*/**',
  ]),
]

export default config
