import type { ComponentProps } from 'react'
import preview from '../../../../.storybook/preview'
import { ProgressRing } from './ProgressRing'

type ProgressRingProps = ComponentProps<typeof ProgressRing>

const meta = preview.type<{ args: ProgressRingProps }>().meta({
  component: ProgressRing,
  argTypes: {
    progress: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    colorClass: {
      control: 'select',
      options: ['text-primary', 'text-success', 'text-muted-foreground'],
    },
    animate: { control: 'boolean' },
    pendingStyle: {
      control: 'select',
      options: ['none', 'dashed'],
    },
  },
  args: {
    label: 'Generation progress',
    colorClass: 'text-primary',
  },
  decorators: [
    Story => (
      <div style={{ padding: 24 }}>
        <Story />
      </div>
    ),
  ],
})

// --- Active generation ---

export const Spinning = meta.story({
  name: 'Active: Spinning (low progress)',
  args: { progress: 0, animate: true, label: 'Starting generation' },
})

export const InProgress = meta.story({
  name: 'Active: In Progress',
  args: { progress: 0.35, animate: true, label: '35 of 100 paragraphs' },
})

export const AlmostDone = meta.story({
  name: 'Active: Almost Done',
  args: { progress: 0.92, animate: true, label: '92 of 100 paragraphs' },
})

export const Completed = meta.story({
  name: 'Completed',
  args: { progress: 1, animate: false, colorClass: 'text-success', label: '100 paragraphs' },
})

// --- Pending ---

export const PendingQueued = meta.story({
  name: 'Pending: Queued',
  args: { progress: 0, animate: false, pendingStyle: 'dashed', label: 'Queued' },
})

export const PendingPaused = meta.story({
  name: 'Pending: Paused (mid-generation)',
  args: { progress: 0.4, animate: false, pendingStyle: 'dashed', label: 'Paused at 40%' },
})
