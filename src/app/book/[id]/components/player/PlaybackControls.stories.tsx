import { expect, fn } from 'storybook/test'
import preview from '#.storybook/preview'
import { PlaybackControls } from './PlaybackControls'

const meta = preview.meta({
  component: PlaybackControls,
  args: {
    isPlaying: false,
    isLoading: false,
    onPlayPause: fn(),
    onSkipBack: fn(),
    onSkipForward: fn(),
  },
  decorators: [
    Story => (
      <div style={{ padding: 48 }}>
        <Story />
      </div>
    ),
  ],
})

/** Player at rest — play, previous, and next sentence controls all active. */
export const Default = meta.story({})

Default.test('clicking play calls onPlayPause', async ({ canvas, args, userEvent }) => {
  await userEvent.click(canvas.getByRole('button', { name: 'Play' }))
  await expect(args.onPlayPause).toHaveBeenCalled()
})

/** Paused on a paragraph with no generated audio — play is blocked and the
 *  tooltip says why instead of failing silently. */
export const MissingAudioParagraph = meta.story({
  args: { disablePlayReason: 'No audio for this paragraph' },
})

MissingAudioParagraph.test(
  'play is blocked and labelled with the reason',
  async ({ canvas, args, userEvent }) => {
    const play = canvas.getByRole('button', { name: 'No audio for this paragraph' })

    await expect(play).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(play)
    await expect(args.onPlayPause).not.toHaveBeenCalled()
  },
)

/** Narration running when a block reason arrives — pausing must stay available. */
export const PlayingWithBlockReason = meta.story({
  args: { disablePlayReason: 'No audio for this paragraph', isPlaying: true },
})

PlayingWithBlockReason.test(
  'pause stays active despite the block reason',
  async ({ canvas, args, userEvent }) => {
    const pause = canvas.getByRole('button', { name: 'Pause' })

    await expect(pause).not.toHaveAttribute('aria-disabled')
    await userEvent.click(pause)
    await expect(args.onPlayPause).toHaveBeenCalled()
  },
)
