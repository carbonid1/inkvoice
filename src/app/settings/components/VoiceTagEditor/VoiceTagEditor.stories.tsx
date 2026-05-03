import { useState } from 'react'
import { expect, fn } from 'storybook/test'
import preview from '#.storybook/preview'
import { VoiceTagEditor } from './VoiceTagEditor'

interface Args {
  initialTags: string[]
  saving: boolean
  onTagsChanged: (tags: string[]) => void
}

const Controlled = ({ initialTags, saving, onTagsChanged }: Args) => {
  const [tags, setTags] = useState(initialTags)

  return (
    <div className="w-80">
      <VoiceTagEditor
        tags={tags}
        saving={saving}
        onTagsChanged={next => {
          setTags(next)
          onTagsChanged(next)
        }}
      />
    </div>
  )
}

const meta = preview.meta({
  component: Controlled,
  args: {
    initialTags: ['male', 'british'],
    saving: false,
    onTagsChanged: fn(),
  },
})

/** Existing tags shown as removable badges plus an input for new ones. */
export const WithTags = meta.story({})

WithTags.test('renders existing tags as removable badges', ({ canvas }) => {
  expect(canvas.getByRole('button', { name: /remove male/i })).toBeInTheDocument()
  expect(canvas.getByRole('button', { name: /remove british/i })).toBeInTheDocument()
})

WithTags.test(
  'clicking a tag remove button reports the new list',
  async ({ canvas, args, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /remove british/i }))
    expect(args.onTagsChanged).toHaveBeenLastCalledWith(['male'])
  },
)

WithTags.test('Enter in the input adds a custom tag', async ({ canvas, args, userEvent }) => {
  const input = canvas.getByPlaceholderText('Add tag...')

  await userEvent.click(input)
  await userEvent.type(input, 'deep{Enter}')

  expect(args.onTagsChanged).toHaveBeenLastCalledWith(['male', 'british', 'deep'])
  expect(input).toHaveValue('')
})

WithTags.test('blank input does not add a tag', async ({ canvas, args, userEvent }) => {
  const input = canvas.getByPlaceholderText('Add tag...')

  await userEvent.click(input)
  await userEvent.type(input, '   {Enter}')

  expect(args.onTagsChanged).not.toHaveBeenCalled()
})

/** Empty state — only the input is visible. */
export const Empty = meta.story({
  args: { initialTags: [] },
})

/** Saving — the input is disabled while a tag update is in flight. */
export const Saving = meta.story({
  args: { saving: true },
})

Saving.test('input is disabled while saving', ({ canvas }) => {
  expect(canvas.getByPlaceholderText('Add tag...')).toBeDisabled()
})
