import type { TocNode } from '@/lib/types/book'
import { normalizeTitle } from '../normalizeTitle/normalizeTitle'

type NcxNode = {
  id: string
  ncx_index: number
  sub: NcxNode[]
}

const firstLeafIndex = (node: TocNode): number | undefined => {
  if (node.children.length === 0) return node.chapterIndex
  for (const child of node.children) {
    const idx = firstLeafIndex(child)
    if (idx !== undefined) return idx
  }
  return undefined
}

export const buildTocTree = (
  ncx: NcxNode[],
  idToChapterIndex: Map<string, number>,
  idToTitle: Map<string, string>,
): TocNode[] => {
  const resolveTitle = (id: string, index: number) =>
    normalizeTitle(idToTitle.get(id) ?? `Chapter ${index + 1}`)

  const convert = (nodes: NcxNode[]): TocNode[] =>
    nodes.flatMap(node => {
      const children = convert(node.sub)
      const chapterIndex = idToChapterIndex.get(node.id)

      if (chapterIndex === undefined) {
        // Parent-only grouping node: inherit first child's chapter index
        const firstChild = children[0]
        if (!firstChild) return []
        const fallbackIndex = firstLeafIndex(firstChild)
        if (fallbackIndex === undefined) return []
        return [
          { title: resolveTitle(node.id, fallbackIndex), chapterIndex: fallbackIndex, children },
        ]
      }

      return [{ title: resolveTitle(node.id, chapterIndex), chapterIndex, children }]
    })

  return deduplicateSiblings(convert(ncx))
}

/**
 * Remove redundant flat nodes that duplicate the next sibling's group header.
 * Common in EPUBs where the same file has two headings (e.g. "Book One" + "Raraku")
 * — the NCX creates two navPoints for the same content, one childless and one with children.
 */
const deduplicateSiblings = (nodes: TocNode[]): TocNode[] => {
  const result: TocNode[] = []
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (!node) continue
    const next = nodes[i + 1]
    if (
      node.children.length === 0 &&
      next &&
      next.children.length > 0 &&
      node.chapterIndex === next.chapterIndex
    ) {
      continue
    }
    result.push({ ...node, children: deduplicateSiblings(node.children) })
  }
  return result
}
