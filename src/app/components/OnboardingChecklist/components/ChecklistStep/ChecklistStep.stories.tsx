import { expect, fn } from 'storybook/test'
import preview from '#.storybook/preview'
import { ChecklistStep, type ChecklistStepStatus } from './ChecklistStep'

const PENDING: ChecklistStepStatus = 'pending'
const DONE: ChecklistStepStatus = 'done'

const meta = preview.meta({
  component: ChecklistStep,
  args: {
    status: PENDING,
    title: 'Pick or create a voice',
    description: 'Use a bundled voice, upload your own, or design one with AI.',
    action: { label: 'Choose voice', href: '/settings#voices' },
  },
  decorators: [
    Story => (
      <div className="w-[560px]">
        <Story />
      </div>
    ),
  ],
})

/** Pending step — circle icon, normal text, action button visible at the row edge. */
export const Pending = meta.story({})

Pending.test('renders title and description', ({ canvas }) => {
  expect(canvas.getByText('Pick or create a voice')).toBeInTheDocument()
  expect(canvas.getByText(/Use a bundled voice/)).toBeInTheDocument()
})

Pending.test('announces incomplete to screen readers', ({ canvas }) => {
  expect(canvas.getByText('incomplete')).toBeInTheDocument()
})

Pending.test('exposes the action as a link', ({ canvas }) => {
  const link = canvas.getByRole('link', { name: /Choose voice/ })

  expect(link).toHaveAttribute('href', '/settings#voices')
})

/** Done step — success-colored check, strikethrough title, no action button. */
export const Done = meta.story({
  args: { status: DONE },
})

Done.test('announces complete to screen readers', ({ canvas }) => {
  expect(canvas.getByText('complete')).toBeInTheDocument()
})

Done.test('omits the action button when complete', ({ canvas }) => {
  expect(canvas.queryByRole('link', { name: /Choose voice/ })).not.toBeInTheDocument()
})

/** Pending step with a click-handler action (no href). Used for in-page jumps like AddBookCard. */
export const ButtonAction = meta.story({
  args: {
    action: { label: 'Open picker', onClick: fn() },
  },
})

ButtonAction.test('renders a button when the action has onClick', ({ canvas }) => {
  expect(canvas.getByRole('button', { name: /Open picker/ })).toBeInTheDocument()
})

ButtonAction.test('clicking calls the handler', async ({ canvas, args, userEvent }) => {
  await userEvent.click(canvas.getByRole('button', { name: /Open picker/ }))
  expect(args.action?.onClick).toHaveBeenCalledOnce()
})

/** Pending step with no action — the row is informational only. */
export const NoAction = meta.story({
  args: { action: undefined },
})

NoAction.test('does not render any action affordance', ({ canvas }) => {
  expect(canvas.queryByRole('link')).not.toBeInTheDocument()
  expect(canvas.queryByRole('button')).not.toBeInTheDocument()
})
