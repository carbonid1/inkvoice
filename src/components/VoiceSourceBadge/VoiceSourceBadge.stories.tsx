import { expect } from 'storybook/test'
import preview from '#.storybook/preview'
import type { VoiceSource } from '@/lib/services/voice/voice.types'
import { VoiceSourceBadge } from './VoiceSourceBadge'

const designSource: VoiceSource = 'design'
const uploadSource: VoiceSource = 'upload'

const meta = preview.meta({
  component: VoiceSourceBadge,
  args: {
    source: designSource,
  },
  decorators: [
    Story => (
      <div className="flex items-center gap-2 p-4">
        <span className="text-sm font-medium">Velvet Otter</span>
        <Story />
      </div>
    ),
  ],
})

/** AI-designed voice — sparkle icon + tooltip. */
export const Designed = meta.story({
  args: { source: designSource },
})

Designed.test('renders an accessible "Designed with AI" trigger', ({ canvas }) => {
  expect(canvas.getByLabelText('Designed with AI')).toBeInTheDocument()
})

/** Uploaded voice — badge renders nothing. */
export const Uploaded = meta.story({
  args: { source: uploadSource },
})

Uploaded.test('renders nothing for uploaded voices', ({ canvas }) => {
  expect(canvas.queryByLabelText('Designed with AI')).not.toBeInTheDocument()
})
