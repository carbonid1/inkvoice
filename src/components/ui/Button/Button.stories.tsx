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
      options: ['primary', 'secondary', 'destructive', 'outline', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['small', 'default', 'large', 'icon'],
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
})

export const Primary = meta.story({
  args: { children: 'Button', variant: 'primary' },
})
Primary.test('fires onClick when clicked', async ({ canvas, userEvent, args }) => {
  const button = await canvas.findByRole('button')
  await userEvent.click(button)
  await expect(args.onClick).toHaveBeenCalledOnce()
})

export const Secondary = meta.story({
  args: { children: 'Secondary', variant: 'secondary' },
})

export const Destructive = meta.story({
  args: { children: 'Delete', variant: 'destructive' },
})

export const Outline = meta.story({
  args: { children: 'Outline', variant: 'outline' },
})

export const Ghost = meta.story({
  args: { children: 'Ghost', variant: 'ghost' },
})

export const Link = meta.story({
  args: { children: 'Link', variant: 'link' },
})

export const Small = meta.story({
  args: { children: 'Small', size: 'small' },
})

export const Large = meta.story({
  args: { children: 'Large', size: 'large' },
})

export const Icon = meta.story({
  args: { children: '✕', size: 'icon', 'aria-label': 'Close' },
})

export const Loading = meta.story({
  args: { children: 'Generating...', loading: true },
})
Loading.test('shows spinner and disables button', async ({ canvas }) => {
  const button = await canvas.findByRole('button')
  await expect(button).toBeDisabled()
  await expect(button).toHaveAttribute('aria-busy', 'true')
})

export const Disabled = meta.story({
  args: { children: 'Disabled', disabled: true },
})
Disabled.test('is disabled and does not respond to clicks', async ({ canvas }) => {
  const button = await canvas.findByRole('button')
  await expect(button).toBeDisabled()
  await expect(button).toHaveStyle({ pointerEvents: 'none' })
})
