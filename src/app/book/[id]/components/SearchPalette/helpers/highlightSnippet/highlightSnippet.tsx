import type { ReactNode } from 'react'

const HIGHLIGHT_CLASS = 'bg-orange-200 dark:bg-amber-500/25 dark:text-amber-200 rounded-sm'

export const highlightSnippet = (
  text: string,
  query: string,
  matchPositions: number[],
): ReactNode => {
  if (matchPositions.length === 0 || query.length === 0) {
    return text
  }

  const parts: ReactNode[] = []
  let cursor = 0

  for (let i = 0; i < matchPositions.length; i++) {
    const start = matchPositions[i]!
    const end = start + query.length

    if (start > cursor) {
      parts.push(text.slice(cursor, start))
    }

    parts.push(
      <mark key={i} className={HIGHLIGHT_CLASS}>
        {text.slice(start, end)}
      </mark>,
    )

    cursor = end
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor))
  }

  return parts
}
