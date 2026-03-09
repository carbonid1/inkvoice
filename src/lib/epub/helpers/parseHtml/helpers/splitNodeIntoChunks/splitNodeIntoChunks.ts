import { getInnerHtml } from '../getInnerHtml/getInnerHtml'
import { getPlainText } from '../getPlainText/getPlainText'
import { sliceHtmlByPlainText } from './helpers/sliceHtmlByPlainText/sliceHtmlByPlainText'
import { splitTextIntoChunks } from './helpers/splitTextIntoChunks/splitTextIntoChunks'
import { MAX_CHUNK_CHARS } from './splitNodeIntoChunks.consts'

export type ChunkMapping = {
  plainText: string
  html: string
}

export const splitNodeIntoChunks = (node: Element): ChunkMapping[] => {
  const plainText = getPlainText(node).replace(/\s+/g, ' ').trim()
  if (!plainText) return []

  const html = getInnerHtml(node).replace(/\s+/g, ' ').trim()

  const chunks = splitTextIntoChunks(plainText, MAX_CHUNK_CHARS)
  if (chunks.length <= 1) return [{ plainText, html }]

  const htmlSlices = sliceHtmlByPlainText(html, chunks)
  return chunks.map((text, i) => ({ plainText: text, html: htmlSlices[i] ?? text }))
}
