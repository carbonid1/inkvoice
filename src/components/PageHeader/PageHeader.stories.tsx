import { expect } from 'storybook/test'
import preview from '#.storybook/preview'
import { PageHeader } from './PageHeader'

const meta = preview.meta({
  component: PageHeader,
  args: {
    children: <h1 className="px-4 py-3 text-lg font-semibold">Test Title</h1>,
  },
})

/** Standard page header with the bottom border that separates it from the page body. */
export const Default = meta.story({})

Default.test('renders children inside a banner element', ({ canvas }) => {
  const header = canvas.getByRole('banner')

  expect(header).toBeInTheDocument()
  expect(canvas.getByText('Test Title')).toBeInTheDocument()
})

/** Borderless variant — used when the header sits above its own visual divider. */
export const Borderless = meta.story({
  args: { noBorder: true },
})
