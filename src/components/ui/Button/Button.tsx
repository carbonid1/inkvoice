'use client'

import { cn } from '@/lib/utils'
import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import type { ButtonProps } from './Button.types'

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 cursor-pointer aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        ghost: 'hover:bg-accent aria-expanded:bg-accent dark:hover:bg-accent/50',
        primary: 'bg-primary text-primary-foreground font-medium hover:bg-primary/90',
        solid: 'bg-blue-500 text-white hover:bg-blue-600',
        outline:
          'border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40',
        subtle: 'text-muted-foreground hover:text-blue-500',
        danger: 'text-muted-foreground hover:text-destructive',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        small: 'h-7 gap-1 px-2.5 text-[0.8rem]',
        default: 'h-8 gap-1.5 px-2.5',
        large: 'h-9 gap-1.5 px-3',
        icon: 'size-8 rounded-full',
        smallIcon: 'size-6 rounded-full',
        largeIcon: 'size-12 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'default',
    },
  },
)

const Button = ({
  className,
  variant,
  size,
  fullWidth,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) => (
  <ButtonPrimitive
    data-slot="button"
    className={cn(
      buttonVariants({ variant, size }),
      fullWidth && 'w-full justify-start',
      className,
    )}
    disabled={disabled ?? loading}
    aria-busy={loading ?? undefined}
    {...props}
  >
    {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
    {children}
  </ButtonPrimitive>
)

export { Button, buttonVariants }
