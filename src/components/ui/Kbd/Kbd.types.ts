import type { VariantProps } from 'class-variance-authority'
import type { kbdVariants } from './Kbd'

type KbdProps = {
  /** Single key or array of keys for combos. 'mod' auto-resolves to Cmd/Ctrl. */
  keys: string | string[]
  className?: string
} & VariantProps<typeof kbdVariants>

export type { KbdProps }
