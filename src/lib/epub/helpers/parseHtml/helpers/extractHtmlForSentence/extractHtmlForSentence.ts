import { decodeNextEntity } from '../decodeNextEntity/decodeNextEntity'

export const extractHtmlForSentence = (html: string, plainSentence: string): string => {
  // Build up HTML until we've accumulated the plain text of the sentence
  let accumulated = ''
  let plainAccumulated = ''
  let inTag = false
  let tagContent = ''

  for (let i = 0; i < html.length; i++) {
    const char = html[i]

    if (char === '<') {
      inTag = true
      tagContent = '<'
      continue
    }

    if (inTag) {
      tagContent += char
      if (char === '>') {
        inTag = false
        accumulated += tagContent
        tagContent = ''
      }
      continue
    }

    // Regular character
    accumulated += char

    // Decode HTML entities for comparison
    const decodedChar = char === '&' ? decodeNextEntity(html, i) : null
    if (decodedChar) {
      plainAccumulated += decodedChar.char
      i += decodedChar.length - 1
      accumulated = accumulated.slice(0, -1) + html.slice(i - decodedChar.length + 1, i + 1)
    } else {
      plainAccumulated += char
    }

    // Check if we've matched the sentence (ignoring whitespace differences)
    const normalizedAccum = plainAccumulated.replace(/\s+/g, ' ').trim()
    const normalizedSentence = plainSentence.replace(/\s+/g, ' ').trim()

    if (normalizedAccum === normalizedSentence) {
      // Include any trailing close tags
      let j = i + 1
      while (j < html.length && html[j] === '<') {
        const closeTagMatch = html.slice(j).match(/^<\/[^>]+>/)
        if (closeTagMatch) {
          accumulated += closeTagMatch[0]
          j += closeTagMatch[0].length
        } else {
          break
        }
      }
      return accumulated
    }
  }

  return accumulated
}
