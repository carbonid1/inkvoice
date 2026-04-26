import { expect, waitFor } from 'storybook/test'
import preview from '#.storybook/preview'
import { TTSStatusPill } from './TTSStatusPill'

const meta = preview.meta({
  component: TTSStatusPill,
  decorators: [
    Story => (
      <div style={{ height: 200, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
})

/** Hidden when the Python TTS server is fully stopped — no chrome unless something is happening. */
export const Stopped = meta.story({ args: { state: 'stopped' } })

Stopped.test('renders nothing in the DOM', ({ canvasElement }) => {
  expect(canvasElement.querySelector('[aria-label^="Voice engine"]')).toBeNull()
})

/** Shown while the Python subprocess is spinning up — spinner + "Starting" copy. */
export const Starting = meta.story({ args: { state: 'starting' } })

Starting.test('exposes an accessible "starting" label', async ({ canvas }) => {
  const pill = await waitFor(() => canvas.getByLabelText('Voice engine starting'))

  expect(pill).toBeVisible()
})

/** Voice engine is up and the model is loaded — shown briefly then hidden after idle. */
export const Ready = meta.story({ args: { state: 'ready' } })

Ready.test('uses the ready label and a filled icon', async ({ canvas }) => {
  const pill = await waitFor(() => canvas.getByLabelText('Voice engine ready'))

  expect(pill).toBeVisible()
})

/** Idle timer fired — Python is being shut down (SIGTERM in flight). */
export const Stopping = meta.story({ args: { state: 'stopping' } })
