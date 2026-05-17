import { expect } from 'storybook/test'
import preview from '#.storybook/preview'
import { UploadTips } from './UploadTips'

const meta = preview.meta({
  component: UploadTips,
  args: { minSeconds: 10, maxSeconds: 20 },
  decorators: [
    Story => (
      <div className="bg-surface-inset inset-shadow-surface w-[480px] rounded-lg p-4">
        <Story />
      </div>
    ),
  ],
})

/** Three tips that frame the recording conditions the user should aim for before uploading. */
export const Default = meta.story({})

Default.test('renders all three tips with their titles', ({ canvas }) => {
  expect(canvas.getByText('10–20 seconds')).toBeInTheDocument()
  expect(canvas.getByText('Quiet room, one speaker')).toBeInTheDocument()
  expect(canvas.getByText('Read how you want a book read')).toBeInTheDocument()
})

/** Custom min/max range — verifies the length tip is parameterized by the props. */
export const CustomRange = meta.story({
  args: { minSeconds: 5, maxSeconds: 30 },
})

CustomRange.test('renders the title from the provided min/max range', ({ canvas }) => {
  expect(canvas.getByText('5–30 seconds')).toBeInTheDocument()
})

Default.test('shows the descriptive sub-copy for each tip', ({ canvas }) => {
  expect(canvas.getByText(/A few natural sentences/)).toBeInTheDocument()
  expect(canvas.getByText(/No music, no overlap/)).toBeInTheDocument()
  expect(canvas.getByText(/The model copies pace and tone/)).toBeInTheDocument()
})

Default.test('exposes the tips as a list to assistive tech', ({ canvas }) => {
  expect(canvas.getAllByRole('listitem')).toHaveLength(3)
})
