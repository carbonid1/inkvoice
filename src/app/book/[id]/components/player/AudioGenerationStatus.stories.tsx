import { expect, fn } from 'storybook/test'
import preview from '#.storybook/preview'
import { AudioGenerationStatus } from './AudioGenerationStatus'

const meta = preview.meta({
  component: AudioGenerationStatus,
  decorators: [
    Story => (
      <div style={{ padding: 48, maxWidth: 640 }}>
        <Story />
      </div>
    ),
  ],
})

/** Reader jumped past the pregeneration frontier — generation is running
 *  behind them, with a live ETA and the way to skip the wait. */
export const GenerationBehindReader = meta.story({
  args: {
    message: 'Audio is generating — about 37m away',
    onGenerateFromHere: fn(),
  },
})

GenerationBehindReader.test(
  'explains the wait and offers to generate from here',
  async ({ canvas, args, userEvent }) => {
    await expect(canvas.getByText('Audio is generating — about 37m away')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Generate from here' }))
    await expect(args.onGenerateFromHere).toHaveBeenCalled()
  },
)

/** Generation was just pointed at this paragraph — audio is seconds away and
 *  playback will start by itself, so the action is withdrawn. */
export const PendingAtThisParagraph = meta.story({
  args: {
    message: "Generating audio for this paragraph — playback will start when it's ready",
    pending: true,
  },
})

PendingAtThisParagraph.test('shows progress without a redundant action', async ({ canvas }) => {
  await expect(
    canvas.getByText("Generating audio for this paragraph — playback will start when it's ready"),
  ).toBeVisible()
  await expect(canvas.queryByRole('button', { name: 'Generate from here' })).not.toBeInTheDocument()
})
