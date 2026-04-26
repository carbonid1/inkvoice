import type { ReactNode } from 'react'

interface PageHeaderProps {
  children: ReactNode
  className?: string
  noBorder?: boolean
}

const BASE_CLASSES = 'sticky top-0 z-10 shrink-0 bg-background'
const BORDER_CLASSES = 'border-b border-border'

export const PageHeader = ({ children, className, noBorder }: PageHeaderProps) => {
  const classes = [BASE_CLASSES, noBorder ? '' : BORDER_CLASSES, className]
    .filter(Boolean)
    .join(' ')

  return <header className={classes}>{children}</header>
}
