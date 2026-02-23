import { mergeDialogueChunks } from '../../../mergeDialogueChunks/mergeDialogueChunks'
import { splitIntoSentences } from '../../../splitSentences/splitSentences'
import { extractHtmlForSentence } from '../extractHtmlForSentence/extractHtmlForSentence'
import { getInnerHtml } from '../getInnerHtml/getInnerHtml'
import { getPlainText } from '../getPlainText/getPlainText'

export type SentenceMapping = {
  plainText: string
  html: string
}

export const splitNodeIntoSentences = (node: Element): SentenceMapping[] => {
  const plainText = getPlainText(node).replace(/\s+/g, ' ').trim()
  const html = getInnerHtml(node).replace(/\s+/g, ' ').trim()

  if (!plainText) return []

  // Split plain text into sentences, then merge dialogue attribution chunks
  const sentences = mergeDialogueChunks(splitIntoSentences(plainText))
  if (sentences.length <= 1) {
    return [{ plainText, html }]
  }

  // Map each sentence back to its HTML representation
  const result: SentenceMapping[] = []
  let htmlRemaining = html
  let plainRemaining = plainText

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i]
    if (!sentence) continue
    const isLast = i === sentences.length - 1

    if (isLast) {
      // Last sentence gets all remaining HTML
      result.push({ plainText: sentence, html: htmlRemaining.trim() })
    } else {
      // Find where this sentence ends in the plain text
      const sentencePos = plainRemaining.indexOf(sentence)
      if (sentencePos === -1) {
        // Fallback: couldn't map, use plain text
        result.push({ plainText: sentence, html: sentence })
        continue
      }

      // Find the corresponding position in HTML
      // We need to map character positions accounting for HTML tags
      const htmlSlice = extractHtmlForSentence(htmlRemaining, sentence)
      result.push({ plainText: sentence, html: htmlSlice.trim() })

      // Advance remaining strings
      plainRemaining = plainRemaining.slice(sentencePos + sentence.length).trim()
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
