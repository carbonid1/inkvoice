import type { SVGProps } from 'react'

export const MoreVerticalIcon = ({ className = 'w-5 h-5', ...props }: SVGProps<SVGSVGElement>) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    {...props}
  >
    <circle cx="12" cy="5" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="19" r="1.5" />
  </svg>
)
