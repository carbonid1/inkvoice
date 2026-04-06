import type { ComponentProps } from 'react'
import { expect } from 'storybook/test'
import preview from '../../../../.storybook/preview'
import { Kbd } from './Kbd'

type KbdProps = ComponentProps<typeof Kbd>

const meta = preview.type<{ args: KbdProps }>().meta({
  component: Kbd,
  argTypes: {
    size: {
      control: 'select',
      options: ['default', 'sm'],
    },
  },
  decorators: [
    Story => (
      <div style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Story />
      </div>
    ),
  ],
})

// --- Single keys ---

/** Plain letter key — the simplest case. */
export const SingleKey = meta.story({
  args: { keys: 'T' },
})

/** Token name resolved to its standard symbol. */
export const EscapeKey = meta.story({
  name: 'Symbolic: Escape',
  args: { keys: 'escape' },
})

/** Spacebar rendered as the ␣ symbol. */
export const SpaceKey = meta.story({
  name: 'Symbolic: Space',
  args: { keys: 'space' },
})

/** Arrow key rendered as a directional symbol. */
export const ArrowKey = meta.story({
  name: 'Symbolic: Arrow',
  args: { keys: 'left' },
})

// --- Combos ---

/** Two-key combo — each key renders as a separate styled element. */
export const ShiftCombo = meta.story({
  name: 'Combo: Shift + T',
  args: { keys: ['shift', 'T'] },
})
ShiftCombo.test('renders separate kbd per key in combo', async ({ canvas }) => {
  const wrapper = canvas.getAllByRole('presentation')[0]
  if (!wrapper) throw new Error('No presentation wrapper found')
  const kbdElements = wrapper.querySelectorAll('kbd')
  await expect(kbdElements.length).toBe(2)
  await expect(kbdElements[0]?.textContent).toBe('⇧')
  await expect(kbdElements[1]?.textContent).toBe('T')
})

/** Mod token resolved to ⌘ on Mac or Ctrl on other platforms. */
export const ModCombo = meta.story({
  name: 'Combo: Mod + F (OS-aware)',
  args: { keys: ['mod', 'F'] },
})

/** Three-key combo showing modifier stacking. */
export const TripleCombo = meta.story({
  name: 'Combo: Mod + Shift + K',
  args: { keys: ['mod', 'shift', 'K'] },
})

// --- Sizes ---

/** Small size used inline within tooltip overlays. */
export const Small = meta.story({
  name: 'Size: Small',
  args: { keys: ['shift', 'B'], size: 'sm' },
})

// --- In context ---

/** Shortcut hint next to a settings label, matching the AppearanceCard layout. */
export const InlineWithText = meta.story({
  name: 'Context: Inline with text',
  args: { keys: ['shift', 'T'], size: 'sm' },
  decorators: [
    Story => (
      <span className="text-muted-foreground flex items-center gap-2 text-sm">
        Theme <Story />
      </span>
    ),
  ],
})

/** Small Kbd on an inverted tooltip background — needs color overrides to stay visible. */
export const TooltipStyle = meta.story({
  name: 'Context: Tooltip background',
  args: { keys: ['mod', 'F'], size: 'sm', className: 'border-transparent bg-background/15' },
  decorators: [
    Story => (
      <div className="bg-foreground text-background flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs">
        Search <Story />
      </div>
    ),
  ],
})
