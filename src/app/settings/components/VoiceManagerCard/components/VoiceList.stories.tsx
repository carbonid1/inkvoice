import { expect, fn } from 'storybook/test'
import preview from '#.storybook/preview'
import type { VoiceEntry } from '@/lib/services/voice/voice.types'
import { VoiceList } from './VoiceList'

const appVoice: VoiceEntry = {
  name: 'clara',
  displayName: 'Clara',
  type: 'app',
  source: 'upload',
  hasSample: true,
  tags: ['female', 'british'],
}

const customVoice: VoiceEntry = {
  name: 'my-voice',
  displayName: 'My Voice',
  type: 'custom',
  source: 'upload',
  hasSample: false,
  tags: ['male'],
}

const meta = preview.meta({
  component: VoiceList,
  args: {
    voices: [appVoice, customVoice],
    selectedVoice: 'clara',
    playing: null,
    tagsSaving: false,
    onSelect: fn(),
    onPlay: fn(),
    onDelete: fn(),
    updateTags: fn((): Promise<string[] | null> => Promise.resolve(null)),
  },
  decorators: [
    Story => (
      <div className="w-[480px]">
        <Story />
      </div>
    ),
  ],
})

/** Mixed list — one user-uploaded voice and one bundled app voice. */
export const Default = meta.story({})

Default.test('Your Voices section is rendered before Included Voices', ({ canvas }) => {
  const headings = canvas.getAllByRole('heading', { level: 3 })

  expect(headings[0]).toHaveTextContent(/Your Voices/)
  expect(headings[1]).toHaveTextContent(/Included Voices/)
})

Default.test('selected row has aria-current=true', ({ canvas }) => {
  expect(canvas.getByRole('button', { name: /^Clara/ })).toHaveAttribute('aria-current', 'true')
})

Default.test('non-selected row does not have aria-current', ({ canvas }) => {
  expect(canvas.getByRole('button', { name: /^My Voice/ })).not.toHaveAttribute(
    'aria-current',
    'true',
  )
})

/** No custom voices — Your Voices header still renders, count badge omitted. */
export const OnlyAppVoices = meta.story({
  args: {
    voices: [appVoice],
  },
})

OnlyAppVoices.test('still shows both section headings', ({ canvas }) => {
  expect(canvas.getByRole('heading', { name: /Your Voices/ })).toBeInTheDocument()
  expect(canvas.getByRole('heading', { name: /Included Voices/ })).toBeInTheDocument()
})

OnlyAppVoices.test('does not display a count next to Your Voices', ({ canvas }) => {
  expect(canvas.getByRole('heading', { name: /Your Voices/ })).not.toHaveTextContent(/\d/)
})
