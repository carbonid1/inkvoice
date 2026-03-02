import type { SVGProps } from 'react'

export const PlusIcon = ({ className = 'w-5 h-5', ...props }: SVGProps<SVGSVGElement>) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </svg>
)
