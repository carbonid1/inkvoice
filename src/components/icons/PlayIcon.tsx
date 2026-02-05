import type { SVGProps } from 'react'

export const PlayIcon = ({ className = 'w-6 h-6', ...props }: SVGProps<SVGSVGElement>) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    {...props}
  >
    <path d="M8 5v14l11-7z" />
  </svg>
)
