'use client'

import { cn } from '@carbonid1/design-system'
import { Search } from 'lucide-react'
import { type ComponentPropsWithoutRef, forwardRef, type ReactNode } from 'react'

type SearchInputProps = Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'className'> & {
  trailing?: ReactNode
  className?: string
  inputClassName?: string
}

const WRAPPER_BASE =
  'border-border bg-background focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/60 flex items-center gap-2 rounded-md border px-3 py-1.5 transition-colors'

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ trailing, className, inputClassName, ...inputProps }, ref) => (
    <div className={cn(WRAPPER_BASE, className)}>
      <Search className="text-muted-foreground size-4 shrink-0" />
      <input
        ref={ref}
        type="text"
        {...inputProps}
        className={cn(
          'placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm outline-hidden',
          inputClassName,
        )}
      />
      {trailing}
    </div>
  ),
)
SearchInput.displayName = 'SearchInput'
