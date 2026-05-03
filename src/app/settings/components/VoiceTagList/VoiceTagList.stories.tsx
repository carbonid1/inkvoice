import { expect } from 'storybook/test'
import preview from '#.storybook/preview'
import { VoiceTagList } from './VoiceTagList'

const meta = preview.meta({
  component: VoiceTagList,
  args: {
    tags: ['british', 'male', 'warm'],
  },
})

/** Inline tag chips that follow a voice's display name in the voice list. */
export const Default = meta.story({})

Default.test('renders each tag as a badge', ({ canvas }) => {
  expect(canvas.getByText('british')).toBeInTheDocument()
  expect(canvas.getByText('male')).toBeInTheDocument()
  expect(canvas.getByText('warm')).toBeInTheDocument()
})
