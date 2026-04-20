import sharedConfig from '@carbonid1/eslint-config/nextjs'

const config = [
  ...sharedConfig,
  {
    rules: {
      'func-style': ['error', 'expression', { allowArrowFunctions: true }],
      'prefer-arrow-callback': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
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
