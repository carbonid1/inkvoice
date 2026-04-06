'use client'

import { getModKey } from '@/lib/helpers/getModKey/getModKey'
import { cn } from '@/lib/utils'
import { cva } from 'class-variance-authority'
import type { KbdProps } from './Kbd.types'

const MOD_SYMBOLS: Record<string, string> = { Cmd: '⌘', Ctrl: 'Ctrl' }

const KEY_SYMBOLS: Record<string, string> = {
  shift: '⇧',
  alt: '⌥',
  enter: '↵',
  backspace: '⌫',
  escape: 'Esc',
  space: '␣',
  left: '←',
  right: '→',
  up: '↑',
  down: '↓',
}

const resolveKey = (key: string): string => {
  const lower = key.toLowerCase()
  if (lower === 'mod') return MOD_SYMBOLS[getModKey()] ?? 'Ctrl'
  return KEY_SYMBOLS[lower] ?? key
}

const kbdVariants = cva(
  'inline-flex items-center justify-center rounded-sm border font-mono leading-none select-none',
  {
    variants: {
      size: {
        sm: 'min-w-4 px-1 py-0.5 text-[10px] border-foreground/10 bg-foreground/10',
        default: 'min-w-5 px-1.5 py-1 text-[11px] border-border bg-muted',
      },
    },
    defaultVariants: { size: 'default' },
  },
)

const Kbd = ({ keys, size, className }: KbdProps) => {
  const keyList = Array.isArray(keys) ? keys : [keys]

  return (
    <span className="inline-flex items-center gap-0.5" role="presentation">
      {keyList.map((key, i) => (
        <kbd key={i} className={cn(kbdVariants({ size }), className)}>
          {resolveKey(key)}
        </kbd>
      ))}
    </span>
  )
}

export { Kbd, kbdVariants }
