import type { SVGProps } from 'react'

type BookmarkIconProps = SVGProps<SVGSVGElement> & {
  filled?: boolean
}

export const BookmarkIcon = ({
  className = 'w-6 h-6',
  filled = false,
  ...props
}: BookmarkIconProps) => (
  <svg className={className} viewBox="0 0 24 24" {...props}>
    {filled ? (
      <path fill="currentColor" d="M5 3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-4-7 4V3z" />
    ) : (
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M5 3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-4-7 4V3z"
      />
    )}
  </svg>
)
