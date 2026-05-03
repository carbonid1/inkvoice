import { expect } from 'storybook/test'
import preview from '#.storybook/preview'
import { useDisplayStore } from '@/store/useDisplayStore'
import { FontSizePopover } from './FontSizePopover'

const meta = preview.meta({
  component: FontSizePopover,
})

/** Reader toolbar control — collapsed to the icon button until the user opens the popover. */
export const Default = meta.story({
  beforeEach: () => {
    useDisplayStore.setState({ fontSize: 'medium' })
  },
})

Default.test('renders the trigger button', ({ canvas }) => {
  expect(canvas.getByRole('button', { name: /font size/i })).toBeInTheDocument()
})

Default.test('opens with the three size options on click', async ({ canvas, userEvent }) => {
  await userEvent.click(canvas.getByRole('button', { name: /font size/i }))

  expect(canvas.getByRole('button', { name: 'Small' })).toBeInTheDocument()
  expect(canvas.getByRole('button', { name: 'Medium' })).toBeInTheDocument()
  expect(canvas.getByRole('button', { name: 'Large' })).toBeInTheDocument()
})

Default.test('selecting a size updates the store', async ({ canvas, userEvent }) => {
  await userEvent.click(canvas.getByRole('button', { name: /font size/i }))
  await userEvent.click(canvas.getByRole('button', { name: 'Large' }))

  expect(useDisplayStore.getState().fontSize).toBe('large')
})

Default.test('closes on Escape', async ({ canvas, userEvent }) => {
  await userEvent.click(canvas.getByRole('button', { name: /font size/i }))
  expect(canvas.getByRole('button', { name: 'Small' })).toBeInTheDocument()

  await userEvent.keyboard('{Escape}')
  expect(canvas.queryByRole('button', { name: 'Small' })).not.toBeInTheDocument()
})

Default.test('closes on click outside', async ({ canvas, userEvent }) => {
  await userEvent.click(canvas.getByRole('button', { name: /font size/i }))
  expect(canvas.getByRole('button', { name: 'Small' })).toBeInTheDocument()

  await userEvent.click(document.body)
  expect(canvas.queryByRole('button', { name: 'Small' })).not.toBeInTheDocument()
})

/** Active size is "Large" — the highlighted option in the popover reflects current store state. */
export const LargeActive = meta.story({
  beforeEach: () => {
    useDisplayStore.setState({ fontSize: 'large' })
  },
})

LargeActive.test('marks Large with aria-pressed=true when open', async ({ canvas, userEvent }) => {
  await userEvent.click(canvas.getByRole('button', { name: /font size/i }))

  expect(canvas.getByRole('button', { name: 'Large' })).toHaveAttribute('aria-pressed', 'true')
  expect(canvas.getByRole('button', { name: 'Medium' })).toHaveAttribute('aria-pressed', 'false')
})
