import type { ContentBlock, TextSegment } from '@/lib/types/book'
import { JSDOM } from 'jsdom'
import { splitIntoSentences } from '../splitSentences/splitSentences'

export const getPlainText = (node: Node): string => {
  if (node.nodeType === 3) {
    // Text node
    return node.textContent || ''
  }
  if (node.nodeType === 1) {
    // Element node
    const el = node as Element
    const tag = el.tagName.toLowerCase()
    // Skip script, style
    if (tag === 'script' || tag === 'style') return ''
    if (tag === 'br') return ' '
    // Recurse
    return Array.from(node.childNodes).map(getPlainText).join('')
  }
  return ''
}

export const getInnerHtml = (node: Node): string => {
  if (node.nodeType === 3) {
    // Text node - escape HTML
    const text = node.textContent || ''
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
  if (node.nodeType === 1) {
    const el = node as Element
    const tag = el.tagName.toLowerCase()
    if (tag === 'script' || tag === 'style') return ''

    const voidElements = ['br', 'hr']
    if (voidElements.includes(tag)) {
      return `<${tag}/>`
    }

    // For inline formatting tags, preserve them
    const inlineTags = ['em', 'i', 'strong', 'b', 'u', 'span', 'a', 'sup', 'sub', 'small']
    const childHtml = Array.from(node.childNodes).map(getInnerHtml).join('')

    if (inlineTags.includes(tag)) {
      // Keep the tag with minimal attributes
      if (tag === 'a') {
        const href = el.getAttribute('href')
        return href ? `<a href="${href}">${childHtml}</a>` : childHtml
      }
      return `<${tag}>${childHtml}</${tag}>`
    }

    // For other tags, just return the content
    return childHtml
  }
  return ''
}

interface SentenceMapping {
  plainText: string
  html: string
}

const decodeNextEntity = (html: string, pos: number): { char: string; length: number } | null => {
  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&mdash;': '\u2014',
    '&ndash;': '\u2013',
    '&lsquo;': '\u2018',
    '&rsquo;': '\u2019',
    '&ldquo;': '\u201c',
    '&rdquo;': '\u201d',
  }

  for (const [entity, char] of Object.entries(entities)) {
    if (html.slice(pos, pos + entity.length) === entity) {
      return { char, length: entity.length }
    }
  }

  // Numeric entity
  const numMatch = html.slice(pos).match(/^&#(\d+);/)
  if (numMatch?.[1]) {
    return { char: String.fromCharCode(parseInt(numMatch[1], 10)), length: numMatch[0].length }
  }

  return null
}

const extractHtmlForSentence = (html: string, plainSentence: string): string => {
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

const splitNodeIntoSentences = (node: Element): SentenceMapping[] => {
  const plainText = getPlainText(node).replace(/\s+/g, ' ').trim()
  const html = getInnerHtml(node).replace(/\s+/g, ' ').trim()

  if (!plainText) return []

  // Split plain text into sentences
  const sentences = splitIntoSentences(plainText)
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
      const htmlConsumed = htmlSlice.length
      // Find next sentence start in remaining HTML by matching the next word
      const nextSentence = sentences[i + 1]
      if (nextSentence) {
        const nextWord = nextSentence.split(/\s/)[0]
        if (nextWord) {
          const nextWordPos = htmlRemaining.indexOf(nextWord, htmlConsumed - nextWord.length)
          if (nextWordPos !== -1) {
            htmlRemaining = htmlRemaining.slice(nextWordPos)
          } else {
            htmlRemaining = htmlRemaining.slice(htmlConsumed).trim()
          }
        } else {
          htmlRemaining = htmlRemaining.slice(htmlConsumed).trim()
        }
      }
    }
  }

  return result
}

const EPIGRAPH_CLASS_PATTERN = /^total(ind|first|second|secondfirst|three)$/

const isEpigraphElement = (el: Element): boolean => {
  const classes = el.getAttribute('class')?.split(/\s+/) ?? []
  return classes.some(c => EPIGRAPH_CLASS_PATTERN.test(c))
}

const isAttributionElement = (el: Element): boolean => {
  const classes = el.getAttribute('class')?.split(/\s+/) ?? []
  if (!classes.includes('r')) return false
  const text = el.textContent?.replace(/\u00a0/g, '').trim() ?? ''
  return text.length > 0
}

export const parseHtmlContent = (
  html: string,
  getImage: (id: string) => Promise<string | null>,
): Promise<{ content: ContentBlock[]; sentences: string[] }> => {
  return parseHtmlContentSync(html, getImage)
}

const parseHtmlContentSync = async (
  html: string,
  getImage: (id: string) => Promise<string | null>,
): Promise<{ content: ContentBlock[]; sentences: string[] }> => {
  const dom = new JSDOM(html)
  const doc = dom.window.document
  const body = doc.body

  const content: ContentBlock[] = []
  const sentences: string[] = []

  const processElement = (el: Element): void => {
    const tag = el.tagName.toLowerCase()

    // Skip script, style, nav, header
    if (['script', 'style', 'nav', 'header', 'footer'].includes(tag)) return

    if (tag === 'img') {
      const src = el.getAttribute('src')
      const alt = el.getAttribute('alt') || ''
      if (src) {
        // Images will be processed later with actual data
        content.push({ type: 'image', src, alt })
      }
      return
    }

    if (tag.match(/^h[1-6]$/)) {
      const level = parseInt(tag[1] ?? '1', 10)
      const mappings = splitNodeIntoSentences(el)
      if (mappings.length > 0) {
        const segments: TextSegment[] = mappings.map(m => {
          const idx = sentences.length
          sentences.push(m.plainText)
          return { sentenceIndex: idx, html: m.html }
        })
        content.push({ type: 'heading', level, segments })
      }
      return
    }

    if (tag === 'blockquote') {
      const mappings = splitNodeIntoSentences(el)
      if (mappings.length > 0) {
        const segments: TextSegment[] = mappings.map(m => {
          const idx = sentences.length
          sentences.push(m.plainText)
          return { sentenceIndex: idx, html: m.html }
        })
        content.push({ type: 'blockquote', segments })
      }
      return
    }

    if (tag === 'ul' || tag === 'ol') {
      const items: TextSegment[][] = []
      const listItems = el.querySelectorAll(':scope > li')
      listItems.forEach(li => {
        const mappings = splitNodeIntoSentences(li)
        if (mappings.length > 0) {
          const segments: TextSegment[] = mappings.map(m => {
            const idx = sentences.length
            sentences.push(m.plainText)
            return { sentenceIndex: idx, html: m.html }
          })
          items.push(segments)
        }
      })
      if (items.length > 0) {
        content.push({ type: 'list', items })
      }
      return
    }

    if (tag === 'p') {
      const blockType: ContentBlock['type'] = isEpigraphElement(el)
        ? 'blockquote'
        : isAttributionElement(el)
          ? 'attribution'
          : 'paragraph'
      const mappings = splitNodeIntoSentences(el)
      if (mappings.length > 0) {
        const segments: TextSegment[] = mappings.map(m => {
          const idx = sentences.length
          sentences.push(m.plainText)
          return { sentenceIndex: idx, html: m.html }
        })
        content.push({ type: blockType, segments })
      }
      return
    }

    if (tag === 'div' || tag === 'section' || tag === 'article') {
      // Recurse into container elements
      Array.from(el.children).forEach(child => processElement(child as Element))
      return
    }

    // For any other element with text content, treat as paragraph
    const text = getPlainText(el).trim()
    if (text) {
      const mappings = splitNodeIntoSentences(el)
      if (mappings.length > 0) {
        const segments: TextSegment[] = mappings.map(m => {
          const idx = sentences.length
          sentences.push(m.plainText)
          return { sentenceIndex: idx, html: m.html }
        })
        content.push({ type: 'paragraph', segments })
      }
    }
  }

  // Process top-level elements
  Array.from(body.children).forEach(child => processElement(child as Element))

  // If no block elements found, try processing body directly
  if (content.length === 0 && body.textContent?.trim()) {
    const mappings = splitNodeIntoSentences(body)
    if (mappings.length > 0) {
      const segments: TextSegment[] = mappings.map(m => {
        const idx = sentences.length
        sentences.push(m.plainText)
        return { sentenceIndex: idx, html: m.html }
      })
      content.push({ type: 'paragraph', segments })
    }
  }

  // Debug: Verify sentence indices match array positions
  if (process.env.NODE_ENV === 'development') {
    let mismatchFound = false
    content.forEach(block => {
      const segments = block.segments || (block.items?.flat() ?? [])
      segments.forEach(seg => {
        if (sentences[seg.sentenceIndex] === undefined) {
          console.error(
            `[epub] Index mismatch: sentenceIndex ${seg.sentenceIndex} out of bounds (sentences.length: ${sentences.length})`,
          )
          mismatchFound = true
        }
      })
    })
    if (!mismatchFound && sentences.length > 0) {
      // Verification passed
    }
  }

  // Process images - convert src to base64 data URLs
  for (const block of content) {
    if (block.type === 'image' && block.src) {
      try {
        const imageData = await getImage(block.src)
        if (imageData) {
          block.src = imageData
        }
      } catch {
        // Leave original src if image loading fails
      }
    }
  }

  return { content, sentences }
}
