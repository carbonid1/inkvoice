import type { ComponentProps } from 'react'
import { expect } from 'storybook/test'
import preview from '../../../../../../../.storybook/preview'
import { BufferRing } from './BufferRing'

type BufferRingProps = ComponentProps<typeof BufferRing>

const meta = preview.type<{ args: BufferRingProps }>().meta({
  component: BufferRing,
  args: {
    ahead: 0,
    isGenerating: false,
  },
  argTypes: {
    ahead: { control: { type: 'range', min: 0, max: 120, step: 1 } },
    isGenerating: { control: 'boolean' },
  },
})

// --- States ---

export const Cold = meta.story({
  args: { ahead: 0, isGenerating: true },
})
Cold.test('shows generating label when cold', async ({ canvas }) => {
  const svg = await canvas.findByRole('img', { hidden: true })
  await expect(svg).toHaveAttribute('aria-label', 'Generating first paragraphs...')
})

export const Warming = meta.story({
  args: { ahead: 5, isGenerating: true },
})

export const Ready = meta.story({
  args: { ahead: 42, isGenerating: true },
})

export const Full = meta.story({
  args: { ahead: 120, isGenerating: false },
})
Full.test('shows buffer full label', async ({ canvas }) => {
  const svg = await canvas.findByRole('img', { hidden: true })
  await expect(svg).toHaveAttribute('aria-label', 'Buffer full')
})

export const IdlePartial = meta.story({
  args: { ahead: 30, isGenerating: false },
})
