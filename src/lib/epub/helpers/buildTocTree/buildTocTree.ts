import type { TocNode } from '@/lib/types/book'

type NcxNode = {
  id: string
  ncx_index: number
  sub: NcxNode[]
}

export const buildTocTree = (
  ncx: NcxNode[],
  idToChapterIndex: Map<string, number>,
  idToTitle: Map<string, string>,
): TocNode[] => {
  const convert = (nodes: NcxNode[]): TocNode[] =>
    nodes.flatMap(node => {
      const chapterIndex = idToChapterIndex.get(node.id)
      if (chapterIndex === undefined) return []
      const title = idToTitle.get(node.id) ?? `Chapter ${chapterIndex + 1}`
      const children = convert(node.sub)
      return [{ title, chapterIndex, children }]
    })

  return convert(ncx)
}
