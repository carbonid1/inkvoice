'use client'

import { cn } from '@/lib/utils'
import { Slider as SliderPrimitive } from '@base-ui/react/slider'

type SliderProps = {
  value: number
  onChange: (value: number) => void
  onCommit?: (value: number) => void
  min: number
  max: number
  step?: number
  disabled?: boolean
  'aria-label'?: string
  className?: string
}

export const Slider = ({
  value,
  onChange,
  onCommit,
  min,
  max,
  step = 1,
  disabled,
  'aria-label': ariaLabel,
  className,
}: SliderProps) => (
  <SliderPrimitive.Root
    value={value}
    onValueChange={v => onChange(v as number)}
    onValueCommitted={v => onCommit?.(v as number)}
    min={min}
    max={max}
    step={step}
    disabled={disabled}
    aria-label={ariaLabel}
    className={cn('relative flex w-full touch-none items-center py-2', className)}
  >
    <SliderPrimitive.Control className="relative flex h-1.5 w-full items-center">
      <SliderPrimitive.Track className="bg-input h-full w-full overflow-hidden rounded-full">
        <SliderPrimitive.Indicator className="bg-primary h-full rounded-full" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={cn(
          'bg-primary border-background block size-4 rounded-full border-2 shadow-sm',
          'focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-hidden',
          disabled && 'pointer-events-none opacity-50',
        )}
      />
    </SliderPrimitive.Control>
  </SliderPrimitive.Root>
)
