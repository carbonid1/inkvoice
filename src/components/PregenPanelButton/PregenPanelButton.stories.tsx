import { expect } from 'storybook/test'
import preview from '#.storybook/preview'
import { usePregenStore } from '@/store/usePregenStore'
import { PregenPanelButton } from './PregenPanelButton'

const meta = preview.meta({
  component: PregenPanelButton,
})

/** Generation-queue button as it sits in a page header. */
export const Default = meta.story({})

Default.test('clicking the button toggles the panel open state', async ({ canvas, userEvent }) => {
  usePregenStore.setState({ panelOpen: false })
  const button = canvas.getByRole('button', { name: 'Generation queue' })

  await userEvent.click(button)
  expect(usePregenStore.getState().panelOpen).toBe(true)

  await userEvent.click(button)
  expect(usePregenStore.getState().panelOpen).toBe(false)
})
