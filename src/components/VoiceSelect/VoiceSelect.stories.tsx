import type { SelectOption } from '@carbonid1/design-system'
import { useState } from 'react'
import { expect, fn } from 'storybook/test'
import preview from '#.storybook/preview'
import type { VoiceEntry } from '@/lib/services/voice/voice.types'
import { VoiceSelect } from './VoiceSelect'

const VOICES: VoiceEntry[] = [
  {
    name: 'narrator',
    displayName: 'Narrator',
    type: 'app',
    source: 'upload',
    hasSample: false,
    tags: [],
  },
  {
    name: 'casual',
    displayName: 'Casual',
    type: 'app',
    source: 'upload',
    hasSample: true,
    tags: ['warm', 'friendly'],
  },
  {
    name: 'alex',
    displayName: 'Alex',
    type: 'custom',
    source: 'upload',
    hasSample: false,
    tags: ['male', 'british'],
  },
  {
    name: 'velvet-otter',
    displayName: 'Velvet Otter',
    type: 'custom',
    source: 'design',
    hasSample: true,
    tags: ['en'],
  },
]

interface Args {
  initialValue: string
  voices: VoiceEntry[]
  placeholder?: string
  extraOptions?: SelectOption[]
  onChange: (name: string) => void
}

const Controlled = ({ initialValue, voices, placeholder, extraOptions, onChange }: Args) => {
  const [value, setValue] = useState(initialValue)

  return (
    <div className="w-72">
      <VoiceSelect
        voices={voices}
        value={value}
        onChange={next => {
          setValue(next)
          onChange(next)
        }}
        placeholder={placeholder}
        extraOptions={extraOptions}
      />
    </div>
  )
}

const meta = preview.meta({
  component: Controlled,
  args: {
    initialValue: 'casual',
    voices: VOICES,
    onChange: fn(),
  },
})

/** Combobox closed — shows the currently selected voice's display name. */
export const Default = meta.story({})

Default.test('renders selected voice in the trigger', ({ canvas }) => {
  expect(canvas.getByRole('button', { name: /casual/i })).toBeInTheDocument()
})

Default.test('opens listbox with all voices on click', async ({ canvas, userEvent }) => {
  await userEvent.click(canvas.getByRole('button', { name: /casual/i }))

  const listbox = canvas.getByRole('listbox')

  expect(listbox).toBeInTheDocument()
  expect(canvas.getByRole('option', { name: /narrator/i })).toBeInTheDocument()
  expect(canvas.getByRole('option', { name: /casual/i })).toBeInTheDocument()
  expect(canvas.getByRole('option', { name: /alex/i })).toBeInTheDocument()
})

Default.test('groups voices into Your Voices + Included Voices', async ({ canvas, userEvent }) => {
  await userEvent.click(canvas.getByRole('button', { name: /casual/i }))

  expect(canvas.getByText('Your Voices')).toBeInTheDocument()
  expect(canvas.getByText('Included Voices')).toBeInTheDocument()
})

Default.test('renders tag list under each option that has tags', async ({ canvas, userEvent }) => {
  await userEvent.click(canvas.getByRole('button', { name: /casual/i }))

  expect(canvas.getByRole('option', { name: /casual/i })).toHaveTextContent('warm, friendly')
  expect(canvas.getByRole('option', { name: /alex/i })).toHaveTextContent('male, british')
  expect(canvas.getByRole('option', { name: /^narrator$/i })).not.toHaveTextContent(',')
})

Default.test(
  'selecting an option calls onChange and closes',
  async ({ canvas, args, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /casual/i }))
    await userEvent.click(canvas.getByRole('option', { name: /alex/i }))

    expect(args.onChange).toHaveBeenLastCalledWith('alex')
    expect(canvas.queryByRole('listbox')).not.toBeInTheDocument()
  },
)

Default.test('Escape closes the listbox', async ({ canvas, userEvent }) => {
  await userEvent.click(canvas.getByRole('button', { name: /casual/i }))
  expect(canvas.getByRole('listbox')).toBeInTheDocument()

  await userEvent.keyboard('{Escape}')
  expect(canvas.queryByRole('listbox')).not.toBeInTheDocument()
})

Default.test('arrow keys + Enter select via keyboard', async ({ canvas, args, userEvent }) => {
  await userEvent.click(canvas.getByRole('button', { name: /casual/i }))
  await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}')

  expect(args.onChange).toHaveBeenCalled()
  expect(canvas.queryByRole('listbox')).not.toBeInTheDocument()
})

/** No voice in the list matches the current value — the trigger falls back to the placeholder. */
export const Placeholder = meta.story({
  args: {
    initialValue: 'unknown',
    placeholder: 'Pick a voice',
  },
})

Placeholder.test('shows placeholder when value matches no voice', ({ canvas }) => {
  expect(canvas.getByRole('button', { name: /pick a voice/i })).toBeInTheDocument()
})

/** Extra option (e.g. "Default (Narrator)") rendered above voice groups. */
export const WithExtraOptions = meta.story({
  args: {
    initialValue: '__default__',
    extraOptions: [{ value: '__default__', label: 'Default (Narrator)' }],
  },
})

WithExtraOptions.test('extra option renders before voice groups', async ({ canvas, userEvent }) => {
  expect(canvas.getByRole('button', { name: /default \(narrator\)/i })).toBeInTheDocument()

  await userEvent.click(canvas.getByRole('button', { name: /default \(narrator\)/i }))
  const options = canvas.getAllByRole('option')

  expect(options[0]).toHaveTextContent('Default (Narrator)')
})
