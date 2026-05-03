import { useState } from 'react'
import { expect, userEvent } from 'storybook/test'
import preview from '#.storybook/preview'
import { Tabs, TabsList, TabsTrigger } from './Tabs'

type Source = 'transcription' | 'preset' | 'custom'

const SOURCES: ReadonlySet<string> = new Set(['transcription', 'preset', 'custom'])
const isSource = (value: unknown): value is Source =>
  typeof value === 'string' && SOURCES.has(value)

const Controlled = ({ initial = 'transcription' }: { initial?: Source }) => {
  const [value, setValue] = useState<Source>(initial)

  return (
    <Tabs
      value={value}
      onValueChange={next => {
        if (isSource(next)) setValue(next)
      }}
      aria-label="Preview text source"
    >
      <TabsList>
        <TabsTrigger value="transcription">Transcription</TabsTrigger>
        <TabsTrigger value="preset">Preset</TabsTrigger>
        <TabsTrigger value="custom">Custom</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

const meta = preview.meta({
  component: Controlled,
})

/** Default segmented control — three sources for the voice preview text. */
export const Default = meta.story({})

Default.test('renders the active option with data-selected', ({ canvas }) => {
  const active = canvas.getByRole('tab', { name: 'Transcription' })

  expect(active).toHaveAttribute('aria-selected', 'true')
})

Default.test('clicking another tab moves selection', async ({ canvas }) => {
  await userEvent.click(canvas.getByRole('tab', { name: 'Custom' }))
  expect(canvas.getByRole('tab', { name: 'Custom' })).toHaveAttribute('aria-selected', 'true')
  expect(canvas.getByRole('tab', { name: 'Transcription' })).toHaveAttribute(
    'aria-selected',
    'false',
  )
})

/** Initial selection mid-list — verifies the controlled value drives which tab renders selected. */
export const PresetSelected = meta.story({
  args: { initial: 'preset' },
})

PresetSelected.test('Preset is selected on mount', ({ canvas }) => {
  expect(canvas.getByRole('tab', { name: 'Preset' })).toHaveAttribute('aria-selected', 'true')
})
