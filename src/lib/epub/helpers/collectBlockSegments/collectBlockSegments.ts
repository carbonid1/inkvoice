import type { ContentBlock, TextSegment } from '@/lib/types/book'

/**
 * Flattens a block to every spoken/highlight unit it contains: own `segments`,
 * list `items`, table `rows` (spoken segments only, not visual `cells`), and —
 * recursively — structured-blockquote `children`, in document order.
 */
export const collectBlockSegments = (block: ContentBlock): TextSegment[] => [
  ...(block.segments ?? []),
  ...(block.items?.flat() ?? []),
  ...(block.rows?.flatMap(row => row.segments) ?? []),
  ...(block.children?.flatMap(collectBlockSegments) ?? []),
]
