import type { SVGProps } from 'react'

export const PauseIcon = ({ className = 'w-6 h-6', ...props }: SVGProps<SVGSVGElement>) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
  </svg>
)
