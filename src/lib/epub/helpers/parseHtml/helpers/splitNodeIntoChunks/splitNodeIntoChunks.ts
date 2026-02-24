import type { ChunkingMode } from '@/lib/types/book'
import { mergeDialogueChunks } from '../../../mergeDialogueChunks/mergeDialogueChunks'
import { splitTextChunks } from '../../../splitTextChunks/splitTextChunks'
import { extractHtmlForSentence } from '../extractHtmlForSentence/extractHtmlForSentence'
import { getInnerHtml } from '../getInnerHtml/getInnerHtml'
import { getPlainText } from '../getPlainText/getPlainText'

export type ChunkMapping = {
  plainText: string
  html: string
}

export const splitNodeIntoChunks = (
  node: Element,
  mode: ChunkingMode = 'sentence',
): ChunkMapping[] => {
  const plainText = getPlainText(node).replace(/\s+/g, ' ').trim()
  const html = getInnerHtml(node).replace(/\s+/g, ' ').trim()

  if (!plainText) return []

  // Split plain text into chunks, then merge dialogue attribution chunks (sentence mode only)
  const rawChunks = splitTextChunks(plainText, mode)
  const chunks = mode === 'sentence' ? mergeDialogueChunks(rawChunks) : rawChunks
  if (chunks.length <= 1) {
    return [{ plainText, html }]
  }

  // Map each chunk back to its HTML representation
  const result: ChunkMapping[] = []
  let htmlRemaining = html
  let plainRemaining = plainText

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    if (!chunk) continue
    const isLast = i === chunks.length - 1

    if (isLast) {
      // Last chunk gets all remaining HTML
      result.push({ plainText: chunk, html: htmlRemaining.trim() })
    } else {
      // Find where this chunk ends in the plain text
      const chunkPos = plainRemaining.indexOf(chunk)
      if (chunkPos === -1) {
        // Fallback: couldn't map, use plain text
        result.push({ plainText: chunk, html: chunk })
        continue
      }

      // Find the corresponding position in HTML
      // We need to map character positions accounting for HTML tags
      const htmlSlice = extractHtmlForSentence(htmlRemaining, chunk)
      result.push({ plainText: chunk, html: htmlSlice.trim() })

      // Advance remaining strings
      plainRemaining = plainRemaining.slice(chunkPos + chunk.length).trim()
      // Skip only whitespace after the consumed HTML, preserving any opening tags
      let nextStart = htmlSlice.length
      while (nextStart < htmlRemaining.length && /\s/.test(htmlRemaining[nextStart]!)) {
        nextStart++
      }
      htmlRemaining = htmlRemaining.slice(nextStart)
    }
  }

  return result
}
