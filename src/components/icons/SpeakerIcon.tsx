import type { SVGProps } from 'react'

export const SpeakerIcon = ({ className = 'w-4 h-4', ...props }: SVGProps<SVGSVGElement>) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.49 4.49 0 002.5-3.5zM14 3.23v2.06a6.51 6.51 0 010 13.42v2.06A8.51 8.51 0 0014 3.23z" />
  </svg>
)
