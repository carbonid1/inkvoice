import { expect, fn } from 'storybook/test'
import preview from '#.storybook/preview'
import {
  type AttributeValues,
  DESIGN_PRESETS,
  EMPTY_ATTRIBUTES,
} from '../../VoiceDesignSection.consts'
import { DesignPresets } from './DesignPresets'

const presetAttrsById = (id: string): AttributeValues => {
  const preset = DESIGN_PRESETS.find(p => p.id === id)

  if (!preset) throw new Error(`Test fixture: no preset with id "${id}"`)
  return preset.attrs
}

const CALM_NARRATOR = presetAttrsById('calm-narrator')
const GRUFF_DETECTIVE = presetAttrsById('gruff-detective')
const PARTIAL_MATCH: AttributeValues = { ...CALM_NARRATOR, accent: 'american accent' }

const meta = preview.meta({
  component: DesignPresets,
  args: {
    attributes: EMPTY_ATTRIBUTES,
    onSelect: fn(),
  },
  decorators: [
    Story => (
      <div className="bg-surface-inset inset-shadow-surface w-[560px] rounded-lg p-4">
        <Story />
      </div>
    ),
  ],
})

/** Idle row — no preset matches the current attributes, all four chips render as outline buttons. */
export const Default = meta.story({})

Default.test('renders all four preset labels', ({ canvas }) => {
  expect(canvas.getByRole('button', { name: /Calm narrator/ })).toBeInTheDocument()
  expect(canvas.getByRole('button', { name: /Gruff detective/ })).toBeInTheDocument()
  expect(canvas.getByRole('button', { name: /Cheerful young/ })).toBeInTheDocument()
  expect(canvas.getByRole('button', { name: /Storyteller elder/ })).toBeInTheDocument()
})

Default.test('every preset reports aria-pressed=false when no attributes match', ({ canvas }) => {
  canvas.getAllByRole('button').forEach(button => {
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })
})

Default.test(
  'clicking a preset fires onSelect with its attribute map',
  async ({ canvas, args, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Gruff detective/ }))
    expect(args.onSelect).toHaveBeenCalledWith(GRUFF_DETECTIVE)
  },
)

/** Calm narrator matches the current attributes — that chip is highlighted (primary variant + aria-pressed). */
export const CalmNarratorActive = meta.story({
  args: { attributes: CALM_NARRATOR },
})

CalmNarratorActive.test('only the matching preset is aria-pressed', ({ canvas }) => {
  expect(canvas.getByRole('button', { name: /Calm narrator/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(canvas.getByRole('button', { name: /Gruff detective/ })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
})

/** User tweaked one dropdown after picking a preset — no chip stays highlighted since attributes no longer match. */
export const PartialMatch = meta.story({
  args: { attributes: PARTIAL_MATCH },
})

PartialMatch.test('no preset is aria-pressed when attributes diverge', ({ canvas }) => {
  canvas.getAllByRole('button').forEach(button => {
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })
})
