const INACTIVE_CLASS = 'bg-orange-200 dark:bg-orange-500/30 rounded-sm'
const ACTIVE_CLASS = 'bg-orange-400 dark:bg-orange-400/50 rounded-sm'

import { escapeRegex } from '@/lib/helpers/escapeRegex/escapeRegex'

/**
 * Decode HTML entities to plain text for matching purposes.
 * Returns array of [decodedChar, originalEntity] pairs.
 */
const decodeHtmlSegments = (html: string): { plainText: string } => {
  const plainChars: string[] = []

  let htmlPos = 0
  let insideTag = false

  while (htmlPos < html.length) {
    const ch = html[htmlPos]!

    if (ch === '<') {
      insideTag = true
      htmlPos++
      continue
    }

    if (ch === '>') {
      insideTag = false
      htmlPos++
      continue
    }

    if (insideTag) {
      htmlPos++
      continue
    }

    // Decode entity
    if (ch === '&') {
      const semiPos = html.indexOf(';', htmlPos)
      if (semiPos !== -1 && semiPos - htmlPos < 10) {
        const entity = html.slice(htmlPos, semiPos + 1)
        const decoded = decodeEntity(entity)
        for (let i = 0; i < decoded.length; i++) {
          plainChars.push(decoded[i]!)
        }
        htmlPos = semiPos + 1
        continue
      }
    }

    plainChars.push(ch)
    htmlPos++
  }

  return {
    plainText: plainChars.join(''),
  }
}

const ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': '\u00A0',
}

const decodeEntity = (entity: string): string => {
  if (ENTITY_MAP[entity]) return ENTITY_MAP[entity]!
  if (entity.startsWith('&#x')) {
    const code = parseInt(entity.slice(3, -1), 16)
    return isNaN(code) ? entity : String.fromCharCode(code)
  }
  if (entity.startsWith('&#')) {
    const code = parseInt(entity.slice(2, -1), 10)
    return isNaN(code) ? entity : String.fromCharCode(code)
  }
  return entity
}

/**
 * Highlight search matches in HTML string by injecting <mark> tags.
 * Handles matches inside tags, across tag boundaries, and HTML entities.
 */
export const highlightSearchMatches = (
  html: string,
  query: string,
  isActiveMatch?: boolean,
): string => {
  if (!query) return html

  const { plainText } = decodeHtmlSegments(html)

  const regex = new RegExp(escapeRegex(query), 'gi')
  const matches: Array<{ start: number; end: number }> = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(plainText)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0]!.length })
  }

  if (matches.length === 0) return html

  const markClass = isActiveMatch ? ACTIVE_CLASS : INACTIVE_CLASS

  // Build result by walking the HTML and injecting marks
  let result = ''
  let htmlPos = 0
  let plainPos = 0
  let currentMatchIndex = 0
  let insideMark = false

  while (htmlPos < html.length) {
    const ch = html[htmlPos]!

    // Handle tags
    if (ch === '<') {
      // If inside a mark, close it before the tag, reopen after
      if (insideMark) {
        result += '</mark>'
      }
      const tagEnd = html.indexOf('>', htmlPos)
      if (tagEnd === -1) {
        result += html.slice(htmlPos)
        break
      }
      result += html.slice(htmlPos, tagEnd + 1)
      htmlPos = tagEnd + 1
      if (insideMark) {
        result += `<mark class="${markClass}">`
      }
      continue
    }

    // Entity handling
    let textChar: string
    let entityLen = 1
    if (ch === '&') {
      const semiPos = html.indexOf(';', htmlPos)
      if (semiPos !== -1 && semiPos - htmlPos < 10) {
        const entity = html.slice(htmlPos, semiPos + 1)
        textChar = decodeEntity(entity)
        entityLen = semiPos + 1 - htmlPos
      } else {
        textChar = ch
      }
    } else {
      textChar = ch
    }

    // Check if we're at a match boundary
    const currentMatch = matches[currentMatchIndex]

    if (currentMatch && plainPos === currentMatch.start && !insideMark) {
      result += `<mark class="${markClass}">`
      insideMark = true
    }

    result += html.slice(htmlPos, htmlPos + entityLen)
    plainPos += textChar.length
    htmlPos += entityLen

    if (insideMark && currentMatch && plainPos >= currentMatch.end) {
      result += '</mark>'
      insideMark = false
      currentMatchIndex++
    }
  }

  if (insideMark) {
    result += '</mark>'
  }

  return result
}
