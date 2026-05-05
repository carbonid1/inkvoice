import { cn } from '@carbonid1/design-system'
import type { ElementType, HTMLAttributes, ReactNode } from 'react'

type Props = HTMLAttributes<HTMLElement> & {
  as?: ElementType
  children: ReactNode
  className?: string
}

const BASE_CLASSES = 'bg-card shadow-card rounded-lg'

export const Card = ({ as: Component = 'div', children, className, ...rest }: Props) => (
  <Component className={cn(BASE_CLASSES, className)} {...rest}>
    {children}
  </Component>
)
