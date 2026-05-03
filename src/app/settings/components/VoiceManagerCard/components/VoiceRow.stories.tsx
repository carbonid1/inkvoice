import { expect, fn } from 'storybook/test'
import preview from '#.storybook/preview'
import type { VoiceEntry } from '@/lib/services/voice/voice.types'
import type { PlayingState } from '../hooks/useVoicePreview/useVoicePreview.types'
import { VoiceRow } from './VoiceRow'

const NOT_PLAYING: PlayingState = null
const PLAYING_SOURCE: PlayingState = { name: 'clara', type: 'source' }

const customVoice: VoiceEntry = {
  name: 'clara',
  displayName: 'Clara',
  type: 'custom',
  hasSample: true,
  tags: ['female', 'british'],
}

const appVoice: VoiceEntry = {
  name: 'narrator',
  displayName: 'Narrator',
  type: 'app',
  hasSample: true,
  tags: ['neutral'],
}

const meta = preview.meta({
  component: VoiceRow,
  args: {
    voice: customVoice,
    selected: false,
    editingTags: false,
    playing: NOT_PLAYING,
    tagsSaving: false,
    onSelect: fn(),
    onToggleTagEditor: fn(),
    onPlay: fn(),
    onTagsChanged: fn(),
    onDelete: fn(),
  },
  decorators: [
    Story => (
      <div className="w-[480px]">
        <Story />
      </div>
    ),
  ],
})

/** Custom voice row — full chrome: name + tags, source + sample buttons, edit tags, delete. */
export const Default = meta.story({})

Default.test('clicking the name calls onSelect', async ({ canvas, args, userEvent }) => {
  await userEvent.click(canvas.getByRole('button', { name: /^Clara/ }))
  expect(args.onSelect).toHaveBeenCalledOnce()
})

Default.test('source button is labelled with the voice name', ({ canvas }) => {
  expect(canvas.getByRole('button', { name: /Play source audio for Clara/ })).toBeInTheDocument()
})

Default.test('sample button is labelled with the voice name', ({ canvas }) => {
  expect(canvas.getByRole('button', { name: /Play voice sample for Clara/ })).toBeInTheDocument()
})

Default.test('tags are rendered inline next to the name', ({ canvas }) => {
  expect(canvas.getByText('female')).toBeInTheDocument()
  expect(canvas.getByText('british')).toBeInTheDocument()
})

Default.test(
  'clicking source play calls onPlay with source',
  async ({ canvas, args, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Play source audio for Clara/ }))
    expect(args.onPlay).toHaveBeenCalledWith('clara', 'source')
  },
)

Default.test(
  'clicking sample play calls onPlay with sample',
  async ({ canvas, args, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Play voice sample for Clara/ }))
    expect(args.onPlay).toHaveBeenCalledWith('clara', 'sample')
  },
)

Default.test(
  'edit-tags button toggles the tag editor for custom voices',
  async ({ canvas, args, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Edit tags for Clara/ }))
    expect(args.onToggleTagEditor).toHaveBeenCalledOnce()
  },
)

Default.test(
  'delete button calls onDelete with the voice name',
  async ({ canvas, args, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Remove Clara/ }))
    expect(args.onDelete).toHaveBeenLastCalledWith('clara')
  },
)

Default.test('row is not aria-current when unselected', ({ canvas }) => {
  expect(canvas.getByRole('button', { name: /^Clara/ })).not.toHaveAttribute('aria-current', 'true')
})

/** Selected row — primary background and aria-current; persists action visibility. */
export const Selected = meta.story({
  args: { selected: true },
})

Selected.test('selected row has aria-current=true', ({ canvas }) => {
  expect(canvas.getByRole('button', { name: /^Clara/ })).toHaveAttribute('aria-current', 'true')
})

/** Editing tags — VoiceTagEditor expands inline beneath the row. */
export const EditingTags = meta.story({
  args: { editingTags: true },
})

EditingTags.test('shows the tag editor with the current tags', ({ canvas }) => {
  expect(canvas.getByRole('button', { name: /remove female/i })).toBeInTheDocument()
  expect(canvas.getByRole('button', { name: /remove british/i })).toBeInTheDocument()
})

/** App voice with no onDelete — read-only chrome: no edit-tags, no remove. */
export const AppVoiceReadOnly = meta.story({
  args: { voice: appVoice, onDelete: undefined },
})

AppVoiceReadOnly.test('hides the edit-tags button on app voices', ({ canvas }) => {
  expect(canvas.queryByRole('button', { name: /Edit tags/ })).not.toBeInTheDocument()
})

AppVoiceReadOnly.test('hides the Remove button when onDelete is omitted', ({ canvas }) => {
  expect(canvas.queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument()
})

/** App voice that has no sample — sample button is omitted entirely. */
export const AppVoiceNoSample = meta.story({
  args: {
    voice: { ...appVoice, hasSample: false },
    onDelete: undefined,
  },
})

AppVoiceNoSample.test('omits the sample button', ({ canvas }) => {
  expect(
    canvas.queryByRole('button', { name: /Play voice sample|Generating sample/ }),
  ).not.toBeInTheDocument()
})

/** Custom voice still generating its sample — sample button is shown but disabled. */
export const CustomGenerating = meta.story({
  args: {
    voice: {
      name: 'my-voice',
      displayName: 'My Voice',
      type: 'custom',
      hasSample: false,
      tags: ['male'],
    },
  },
})

CustomGenerating.test('sample button is disabled while generating', ({ canvas }) => {
  expect(canvas.getByRole('button', { name: /Generating sample for My Voice/ })).toBeDisabled()
})

/** Source audio is playing — source button toggles to a Stop label. */
export const PlayingSource = meta.story({
  args: { playing: PLAYING_SOURCE },
})

PlayingSource.test('source button shows Stop when playing source', ({ canvas }) => {
  expect(canvas.getByRole('button', { name: 'Stop' })).toBeInTheDocument()
  expect(canvas.queryByRole('button', { name: /Play source audio/ })).not.toBeInTheDocument()
})
