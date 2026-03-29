import type { WordTimestamp } from '@/lib/types/wordTimestamp'

type TextNodeBookmark = {
  node: Text
  start: number
  end: number
}

/**
 * Collect all text nodes from an element using TreeWalker,
 * building a flat string with bookmarks for node boundaries.
 */
const collectTextNodes = (element: HTMLElement): { text: string; nodes: TextNodeBookmark[] } => {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  const nodes: TextNodeBookmark[] = []
  let offset = 0

  let node = walker.nextNode() as Text | null
  while (node) {
    const length = node.textContent?.length ?? 0
    if (length > 0) {
      nodes.push({ node, start: offset, end: offset + length })
      offset += length
    }
    node = walker.nextNode() as Text | null
  }

  return { text: nodes.map(n => n.node.textContent).join(''), nodes }
}

/**
 * Find the text node and offset for a given character position
 * in the flat concatenated text.
 */
const findNodeAtOffset = (
  nodes: TextNodeBookmark[],
  charOffset: number,
): { node: Text; offset: number } | null => {
  for (const bookmark of nodes) {
    if (charOffset >= bookmark.start && charOffset < bookmark.end) {
      return { node: bookmark.node, offset: charOffset - bookmark.start }
    }
  }
  // charOffset at the very end
  const last = nodes[nodes.length - 1]
  if (last && charOffset === last.end) {
    return { node: last.node, offset: last.node.textContent?.length ?? 0 }
  }
  return null
}

/**
 * Build a DOM Range for each word timestamp by matching words
 * to their positions in the element's text content.
 */
export const buildWordRanges = (
  element: HTMLElement,
  timestamps: WordTimestamp[],
): (Range | null)[] => {
  if (timestamps.length === 0) return []

  const { text, nodes } = collectTextNodes(element)
  if (nodes.length === 0) return []

  const ranges: (Range | null)[] = new Array(timestamps.length).fill(null)
  let searchFrom = 0

  for (let i = 0; i < timestamps.length; i++) {
    const ts = timestamps[i]
    if (!ts) continue

    const wordStart = findWordInText(text, ts.w, searchFrom)
    if (wordStart === -1) continue

    const wordEnd = wordStart + ts.w.length

    const startPos = findNodeAtOffset(nodes, wordStart)
    const endPos = findNodeAtOffset(nodes, wordEnd)

    if (!startPos || !endPos) continue

    try {
      const range = document.createRange()
      range.setStart(startPos.node, startPos.offset)
      range.setEnd(endPos.node, endPos.offset)
      ranges[i] = range
    } catch {
      // Invalid range
    }

    searchFrom = wordEnd
  }

  return ranges
}

/**
 * Find a word in text starting from a given position.
 * Handles punctuation attached to words by doing a fuzzy match:
 * strips leading/trailing punctuation from both the search word
 * and potential match candidates.
 */
const findWordInText = (text: string, word: string, from: number): number => {
  // Try exact match first
  const exactIdx = text.indexOf(word, from)
  if (exactIdx !== -1) return exactIdx

  // Strip leading/trailing punctuation for fuzzy match
  const stripped = word.replace(/^[^\w]+|[^\w]+$/g, '')
  if (stripped && stripped !== word) {
    const fuzzyIdx = text.indexOf(stripped, from)
    if (fuzzyIdx !== -1) {
      // Expand to include surrounding punctuation if adjacent
      let start = fuzzyIdx
      let end = fuzzyIdx + stripped.length
      while (start > from && /[^\s\w]/.test(text[start - 1] ?? '')) start--
      while (end < text.length && /[^\s\w]/.test(text[end] ?? '')) end++
      return start
    }
  }

  return -1
}
