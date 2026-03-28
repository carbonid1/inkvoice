import type { ComponentProps } from 'react'
import { expect, fn } from 'storybook/test'
import preview from '../../../../.storybook/preview'
import { Button } from './Button'

type ButtonProps = ComponentProps<typeof Button>

// TODO: Remove `.type<>()` workaround after upgrading to Storybook 11.
// SB11 adds `const` modifier to factory generics, fixing args inference for intersection types.
// See: https://github.com/storybookjs/storybook/issues/32829
const meta = preview.type<{ args: ButtonProps }>().meta({
  component: Button,
  args: {
    onClick: fn(),
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['ghost', 'primary', 'solid', 'outline', 'destructive', 'subtle', 'danger', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'small', 'large', 'icon', 'smallIcon', 'largeIcon'],
    },
    fullWidth: { control: 'boolean' },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
})

// --- Variants ---

export const Ghost = meta.story({
  args: { children: 'Ghost', variant: 'ghost' },
})

export const Primary = meta.story({
  args: { children: 'Primary', variant: 'primary' },
})
Primary.test('fires onClick when clicked', async ({ canvas, userEvent, args }) => {
  const button = await canvas.findByRole('button')
  await userEvent.click(button)
  await expect(args.onClick).toHaveBeenCalledOnce()
})

export const Solid = meta.story({
  args: { children: 'Upload', variant: 'solid' },
})

export const Outline = meta.story({
  args: { children: 'Outline', variant: 'outline' },
})

export const Destructive = meta.story({
  args: { children: 'Delete Account', variant: 'destructive' },
})

export const Subtle = meta.story({
  args: { children: '▶', size: 'icon', variant: 'subtle', 'aria-label': 'Play source' },
})

export const Danger = meta.story({
  args: { children: '✕', size: 'icon', variant: 'danger', 'aria-label': 'Delete' },
})

export const Link = meta.story({
  args: { children: 'Learn more', variant: 'link' },
})

// --- Sizes ---

export const IconSize = meta.story({
  args: { children: '✕', size: 'icon', 'aria-label': 'Close' },
})

export const SmallIconSize = meta.story({
  args: { children: '✕', size: 'smallIcon', 'aria-label': 'Dismiss' },
})

export const LargeIconSize = meta.story({
  args: { children: '▶', size: 'largeIcon', variant: 'solid', 'aria-label': 'Play' },
})

export const SmallSize = meta.story({
  args: { children: 'Copy Text', size: 'small' },
})

export const LargeSize = meta.story({
  args: { children: 'Continue', size: 'large', variant: 'primary' },
})

// --- FullWidth ---

export const FullWidthPrimary = meta.story({
  args: {
    children: 'Continue to Next Chapter',
    variant: 'primary',
    size: 'large',
    fullWidth: true,
  },
})

export const FullWidthMenuItem = meta.story({
  args: { children: 'Copy Text', size: 'small', fullWidth: true },
})

// --- States ---

export const Loading = meta.story({
  args: { children: 'Generating...', variant: 'solid', loading: true },
})
Loading.test('shows spinner and disables button', async ({ canvas }) => {
  const button = await canvas.findByRole('button')
  await expect(button).toBeDisabled()
  await expect(button).toHaveAttribute('aria-busy', 'true')
})

export const Disabled = meta.story({
  args: { children: 'Disabled', variant: 'primary', disabled: true },
})
Disabled.test('is disabled and does not respond to clicks', async ({ canvas }) => {
  const button = await canvas.findByRole('button')
  await expect(button).toBeDisabled()
  await expect(button).toHaveStyle({ pointerEvents: 'none' })
})
