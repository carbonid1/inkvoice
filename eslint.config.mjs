import sharedConfig from '@carbonid1/eslint-config/nextjs'

const config = [
  ...sharedConfig,
  {
    ignores: [
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
      '.claude/worktrees/**',
    ],
  },
]

export default config
