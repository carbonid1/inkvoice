import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import eslintConfigPrettier from 'eslint-config-prettier'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      'import/newline-after-import': 'warn',
    },
  },
  eslintConfigPrettier,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'venv/**', 'api/**', 'data/**']),
])

export default eslintConfig
