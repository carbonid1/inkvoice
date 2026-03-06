import { getInnerHtml } from '../getInnerHtml/getInnerHtml'
import { getPlainText } from '../getPlainText/getPlainText'

export type ChunkMapping = {
  plainText: string
  html: string
}

export const splitNodeIntoChunks = (node: Element): ChunkMapping[] => {
  const plainText = getPlainText(node).replace(/\s+/g, ' ').trim()
  if (!plainText) return []

  const html = getInnerHtml(node).replace(/\s+/g, ' ').trim()
  return [{ plainText, html }]
}
