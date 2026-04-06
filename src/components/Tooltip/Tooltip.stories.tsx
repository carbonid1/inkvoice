import type { ComponentProps } from 'react'
import { expect, waitFor } from 'storybook/test'
import preview from '../../../.storybook/preview'
import { Tooltip } from './Tooltip'

type TooltipProps = ComponentProps<typeof Tooltip>

const meta = preview.type<{ args: TooltipProps }>().meta({
  component: Tooltip,
  argTypes: {
    position: {
      control: 'select',
      options: ['top', 'bottom'],
    },
    disabled: { control: 'boolean' },
    delay: { control: 'number' },
    maxWidth: { control: 'number' },
  },
  args: {
    label: 'Tooltip label',
    children: <button style={{ padding: '8px 16px' }}>Hover me</button>,
  },
  decorators: [
    Story => (
      <div style={{ padding: 80, display: 'flex', justifyContent: 'center' }}>
        <Story />
      </div>
    ),
  ],
})

// --- Variants ---

/** Label-only tooltip with no shortcut — the most common usage. */
export const Default = meta.story({
  args: { label: 'Default tooltip' },
})
Default.test('is hidden by default', async ({ canvas }) => {
  await expect(canvas.queryByRole('tooltip')).toBeNull()
})
Default.test('shows on hover and hides on leave', async ({ canvas, userEvent }) => {
  const button = await canvas.findByRole('button')
  await userEvent.hover(button)
  await waitFor(() => expect(canvas.getByRole('tooltip')).toHaveTextContent('Default tooltip'))
  await userEvent.unhover(button)
  await waitFor(() => expect(canvas.queryByRole('tooltip')).toBeNull())
})
Default.test('shows on focus and hides on blur', async ({ canvas }) => {
  const button = await canvas.findByRole('button')
  button.focus()
  await waitFor(() => expect(canvas.getByRole('tooltip')).toHaveTextContent('Default tooltip'))
  button.blur()
  await waitFor(() => expect(canvas.queryByRole('tooltip')).toBeNull())
})
Default.test('does not render kbd when shortcut omitted', async ({ canvas, userEvent }) => {
  const button = await canvas.findByRole('button')
  await userEvent.hover(button)
  await waitFor(() => {
    expect(canvas.getByRole('tooltip').querySelector('kbd')).toBeNull()
  })
})
Default.test('hides on pointerdown', async ({ canvas, userEvent }) => {
  const button = await canvas.findByRole('button')
  await userEvent.hover(button)
  await waitFor(() => expect(canvas.getByRole('tooltip')).toBeInTheDocument())
  await userEvent.pointer({ keys: '[MouseLeft>]', target: button })
  await waitFor(() => expect(canvas.queryByRole('tooltip')).toBeNull())
})

/** Single-key shortcut badge shown alongside the label. */
export const WithShortcut = meta.story({
  args: { label: 'Play', shortcut: 'Space' },
})
WithShortcut.test('renders shortcut kbd on hover', async ({ canvas, userEvent }) => {
  const button = await canvas.findByRole('button')
  await userEvent.hover(button)
  await waitFor(() => {
    const tooltip = canvas.getByRole('tooltip')
    expect(tooltip).toHaveTextContent('Play')
    expect(tooltip.querySelector('kbd')).not.toBeNull()
  })
})

/** Multi-key combo shortcut — each key rendered as a separate Kbd element. */
export const WithComboShortcut = meta.story({
  args: { label: 'Search', shortcut: ['mod', 'F'] },
})
WithComboShortcut.test('renders multiple kbd elements for combo', async ({ canvas, userEvent }) => {
  const button = await canvas.findByRole('button')
  await userEvent.hover(button)
  await waitFor(() => {
    const kbdElements = canvas.getByRole('tooltip').querySelectorAll('kbd')
    expect(kbdElements.length).toBe(2)
  })
})

/** Tooltip anchored below the trigger — used in headers and top-of-page areas. */
export const BottomPosition = meta.story({
  args: { label: 'Bottom tooltip', position: 'bottom' },
})

/** Long text constrained to a max width, wrapping across multiple lines. */
export const WithMaxWidth = meta.story({
  args: {
    label: 'This is a very long tooltip that should wrap to multiple lines when maxWidth is set',
    maxWidth: 200,
  },
})
WithMaxWidth.test('applies max-width style and wraps text', async ({ canvas, userEvent }) => {
  const button = await canvas.findByRole('button')
  await userEvent.hover(button)
  await waitFor(() => {
    const tooltip = canvas.getByRole('tooltip')
    expect(tooltip).toHaveStyle({ maxWidth: '200px' })
    expect(tooltip.className).toContain('whitespace-normal')
  })
})

/** Tooltip suppressed while a popover or menu is open. */
export const Disabled = meta.story({
  args: { label: 'Disabled tooltip', disabled: true },
})
Disabled.test('does not show when disabled', async ({ canvas, userEvent }) => {
  const button = await canvas.findByRole('button')
  await userEvent.hover(button)
  await new Promise(r => setTimeout(r, 300))
  await expect(canvas.queryByRole('tooltip')).toBeNull()
})

/** Longer delay for progressive-disclosure tooltips on data visualizations. */
export const CustomDelay = meta.story({
  args: { label: 'Slow tooltip', delay: 500 },
})

/** Icon-only button that gets its accessible name from the tooltip label. */
export const IconOnlyTrigger = meta.story({
  args: {
    label: 'Previous Sentence',
    children: (
      <button>
        <span>icon</span>
      </button>
    ),
  },
})
IconOnlyTrigger.test('sets aria-label from label prop', async ({ canvas }) => {
  const button = await canvas.findByRole('button')
  await expect(button).toHaveAttribute('aria-label', 'Previous Sentence')
})

/** Trigger with a pre-existing aria-label that should not be overwritten. */
export const CustomAriaLabel = meta.story({
  args: {
    label: 'Previous Sentence',
    children: <button aria-label="Custom label">icon</button>,
  },
})
CustomAriaLabel.test('preserves existing aria-label on trigger', async ({ canvas }) => {
  const button = await canvas.findByRole('button')
  await expect(button).toHaveAttribute('aria-label', 'Custom label')
})
