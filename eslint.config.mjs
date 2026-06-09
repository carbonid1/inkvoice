import sharedConfig from '@carbonid1/eslint-config/nextjs'

const config = [
  ...sharedConfig,
  {
    files: [
      'src/app/**/page.tsx',
      'src/app/**/layout.tsx',
      'src/app/**/loading.tsx',
      'src/app/**/error.tsx',
      'src/app/**/not-found.tsx',
      'src/app/**/route.ts',
      'tests/e2e/global-setup.ts',
      'tests/e2e/global-teardown.ts',
    ],
    rules: {
      'import/no-default-export': 'off',
    },
  },
  {
    ignores: [
      '.next/**',
      '.next-e2e/**',
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
      'scripts/nest-pnpm-deps.js',
      'scripts/dev-control-plane.ts',
      'dist/**',
      'dist-*/**',
    ],
  },
]

export default config
