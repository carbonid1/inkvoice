import { defineMain } from '@storybook/nextjs-vite/node'

export default defineMain({
  framework: '@storybook/nextjs-vite',
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-themes',
    '@storybook/addon-vitest',
    '@storybook/addon-mcp',
  ],
  features: {
    experimentalTestSyntax: true,
  },
})
