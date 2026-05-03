'use client'

import { cn } from '@carbonid1/design-system'

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  'aria-label'?: string
  'aria-labelledby'?: string
  id?: string
  className?: string
}

export const Switch = ({
  checked,
  onCheckedChange,
  disabled,
  className,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: SwitchProps) => (
  <button
    type="button"
    role="switch"
    id={id}
    aria-checked={checked}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy}
    disabled={disabled}
    onClick={() => onCheckedChange(!checked)}
    data-state={checked ? 'checked' : 'unchecked'}
    className={cn(
      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors',
      'focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
      'disabled:cursor-not-allowed disabled:opacity-50',
      checked ? 'bg-primary' : 'bg-input',
      className,
    )}
  >
    <span
      data-state={checked ? 'checked' : 'unchecked'}
      className={cn(
        'bg-background pointer-events-none block h-4 w-4 rounded-full shadow ring-0 transition-transform',
        checked ? 'translate-x-4' : 'translate-x-0.5',
      )}
    />
  </button>
)
