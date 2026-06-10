import { expect, fn } from 'storybook/test'
import preview from '#.storybook/preview'
import type { ChapterInfo } from '@/lib/types/book'
import { ChapterDrawer } from './ChapterDrawer'

const CHAPTERS: ChapterInfo[] = [
  { title: 'Story of the Door', paragraphCount: 24, wordCount: 3200 },
  { title: 'Search for Mr. Hyde', paragraphCount: 31, wordCount: 4100 },
  { title: 'The Carew Murder Case', paragraphCount: 19, wordCount: 2700 },
]

const meta = preview.meta({
  component: ChapterDrawer,
  args: {
    isOpen: true,
    onClose: fn(),
    onNavigate: fn(),
    chapters: CHAPTERS,
    currentChapter: 1,
  },
})

/** Drawer open on a flat chapter list with the second chapter active. */
export const Open = meta.story({})

Open.test('names the close button for assistive tech', ({ canvas }) => {
  canvas.getByRole('button', { name: 'Close table of contents' })
})

Open.test(
  'clicking a chapter navigates to it and closes the drawer',
  async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /The Carew Murder Case/ }))
    expect(args.onNavigate).toHaveBeenCalledWith(2)
    expect(args.onClose).toHaveBeenCalled()
  },
)
