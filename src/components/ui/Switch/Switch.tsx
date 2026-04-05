'use client'

import { cn } from '@/lib/utils'
import { Switch as SwitchPrimitive } from '@base-ui/react/switch'

type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  'aria-label'?: string
  className?: string
}

export const Switch = ({
  checked,
  onChange,
  disabled,
  'aria-label': ariaLabel,
  className,
}: SwitchProps) => (
  <SwitchPrimitive.Root
    checked={checked}
    onCheckedChange={checked => onChange(checked)}
    disabled={disabled}
    aria-label={ariaLabel}
    className={cn(
      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors',
      'focus-visible:ring-ring/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:outline-hidden',
      checked ? 'bg-primary' : 'bg-input',
      disabled && 'pointer-events-none opacity-50',
      className,
    )}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        'bg-background pointer-events-none block size-[18px] rounded-full shadow-sm transition-transform',
        checked ? 'translate-x-5.5' : 'translate-x-[3px]',
      )}
    />
  </SwitchPrimitive.Root>
)
