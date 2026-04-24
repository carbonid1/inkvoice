import preview from '#.storybook/preview'
import { expect, fn, waitFor, within } from 'storybook/test'
import { ParagraphContextMenu } from './ParagraphContextMenu'

const meta = preview.meta({
  component: ParagraphContextMenu,
  args: {
    chapter: 3,
    paragraph: 5,
    onCopyText: fn(),
    onRegenerate: fn(),
    children: <span className="cursor-pointer">A paragraph of text to right-click.</span>,
  },
  decorators: [
    Story => (
      <div style={{ padding: 48 }}>
        <Story />
      </div>
    ),
  ],
})

/** Wraps a paragraph span and exposes Copy Text / Regenerate Audio on right-click. */
export const Default = meta.story({})

Default.test(
  'Copy Text calls onCopyText with chapter and paragraph',
  async ({ canvas, args, userEvent }) => {
    const body = within(document.body)
    const trigger = canvas.getByText('A paragraph of text to right-click.')
    await userEvent.pointer({ keys: '[MouseRight]', target: trigger })
    const item = await waitFor(() => body.getByRole('menuitem', { name: 'Copy Text' }))
    await userEvent.click(item)
    await expect(args.onCopyText).toHaveBeenCalledWith(3, 5)
  },
)

Default.test(
  'Regenerate Audio calls onRegenerate with chapter and paragraph',
  async ({ canvas, args, userEvent }) => {
    const body = within(document.body)
    const trigger = canvas.getByText('A paragraph of text to right-click.')
    await userEvent.pointer({ keys: '[MouseRight]', target: trigger })
    const item = await waitFor(() => body.getByRole('menuitem', { name: 'Regenerate Audio' }))
    await userEvent.click(item)
    await expect(args.onRegenerate).toHaveBeenCalledWith(3, 5)
  },
)
