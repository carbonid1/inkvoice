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
  // Compose the @carbonid1/design-system Storybook (separate `packages` repo, port 7006)
  // into this one's sidebar, so 7007 shows InkVoice's components AND the library's in a
  // single view — and the inkvoice-storybook MCP serves both. DEVELOPMENT-gated so the
  // localhost URL is never baked into a production `build-storybook`. The ref'd Storybook
  // must be running (`pnpm storybook:all`) for its section to populate — otherwise it
  // shows as offline in the sidebar.
  refs: (_config, { configType }) =>
    configType === 'DEVELOPMENT'
      ? {
          'design-system': {
            title: '@carbonid1/design-system',
            url: 'http://localhost:7006',
            // Collapse the library section by default — InkVoice's own components are the focus.
            expanded: false,
            sourceUrl: 'https://github.com/carbonid1/packages/tree/main/packages/design-system',
          },
        }
      : undefined,
  features: {
    experimentalTestSyntax: true,
  },
})
