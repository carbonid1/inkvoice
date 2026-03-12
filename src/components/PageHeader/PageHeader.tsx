import type { PageHeaderProps } from './PageHeader.types'

const BASE_CLASSES =
  'sticky top-0 z-10 flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700'

export const PageHeader = ({ children, className }: PageHeaderProps) => (
  <header className={className ? `${BASE_CLASSES} ${className}` : BASE_CLASSES}>{children}</header>
)
