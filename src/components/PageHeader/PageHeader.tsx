import type { PageHeaderProps } from './PageHeader.types'

const BASE_CLASSES = 'sticky top-0 z-10 shrink-0 bg-background border-b border-border'

export const PageHeader = ({ children, className }: PageHeaderProps) => (
  <header className={className ? `${BASE_CLASSES} ${className}` : BASE_CLASSES}>{children}</header>
)
