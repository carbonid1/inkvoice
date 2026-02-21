import type { ContentBlock } from '@/lib/types/book'

const getBlockPlainText = (block: ContentBlock): string =>
  block.segments?.map(s => s.html.replace(/<[^>]+>/g, '')).join('').trim() ?? ''

const MAX_SEARCH_DEPTH = 5

/**
 * Find the index of the first heading block that duplicates the chapter title.
 * Only searches the first few blocks to avoid false positives deeper in content.
 * Returns -1 if no duplicate found.
 */
export const findDuplicateTitleIndex = (
  content: ContentBlock[],
  title: string,
): number => {
  const normalizedTitle = title.trim().toLowerCase()
  const limit = Math.min(content.length, MAX_SEARCH_DEPTH)

  for (let i = 0; i < limit; i++) {
    const block = content[i]
    if (block?.type === 'heading' && getBlockPlainText(block).toLowerCase().replace(/:$/, '') === normalizedTitle) {
      return i
    }
  }

  return -1
}
