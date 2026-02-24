import type { ChunkingMode } from '@/lib/types/book'
import { ABBREVIATIONS } from '../../epub.consts'
import { SPEECH_VERBS } from '../mergeDialogueChunks/mergeDialogueChunks.consts'
import { findEllipsisRanges } from './helpers/findEllipsisRanges/findEllipsisRanges'
import { isEllipsisDot } from './helpers/isEllipsisDot/isEllipsisDot'

export const isValidSentenceEnd = (text: string, index: number): boolean => {
  // Get word ending at this period
  let start = index - 1
  while (start >= 0 && !/\s/.test(text[start] ?? '')) start--
  const word = text.slice(start + 1, index + 1).toLowerCase()

  // Check if it's an abbreviation
  if (ABBREVIATIONS.has(word)) return false

  // Check if period is inside a number (e.g., "3.14") or version (e.g., "v2.0.1")
  const before = text.slice(Math.max(0, index - 3), index)
  const after = text.slice(index, Math.min(text.length, index + 4))
  const context = before + after
  if (/\d\.\d/.test(context)) return false

  return true
}

// After an ellipsis, uppercase or opening quote signals a new sentence
const SENTENCE_START_AFTER_ELLIPSIS = /^[A-Z\u201c\u2018"']/

export const splitTextChunks = (text: string, mode: ChunkingMode = 'sentence'): string[] => {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return []

  // Paragraph mode: entire text as one chunk (paragraph boundaries
  // are already handled at the HTML element level in parseHtml)
  if (mode === 'paragraph') return [cleaned]

  const ellipsisRanges = findEllipsisRanges(cleaned)

  const sentences: string[] = []
  let start = 0

  // Match sentence endings: .!?… optionally followed by quotes, then whitespace
  const endPattern = /[.!?\u2026]["'\u201d\u2019]?\s+/g
  let match

  while ((match = endPattern.exec(cleaned)) !== null) {
    const idx = match.index
    const char = cleaned[idx] as string

    if (char === '.') {
      if (isEllipsisDot(idx, ellipsisRanges, cleaned.slice(idx + match[0].length))) {
        continue
      }
      if (!isValidSentenceEnd(cleaned, idx)) {
        continue
      }
    } else if (char === '\u2026') {
      const afterText = cleaned.slice(idx + match[0].length)
      if (!SENTENCE_START_AFTER_ELLIPSIS.test(afterText)) continue
    }

    // Check if match includes a trailing closing quote (e.g. ?' or !" or .')
    const hasTrailingQuote = match[0].length >= 2 && /["'\u201d\u2019]/.test(match[0][1]!)

    // Punctuation + closing quote + dialogue attribution = not a sentence boundary
    // Handles both lowercase (?' he asked.) and proper noun (?' Fiddler asked.)
    if (hasTrailingQuote) {
      const afterText = cleaned.slice(idx + match[0].length)
      if (afterText && /^[a-z]/.test(afterText)) continue
      const words = afterText
        .slice(0, 80)
        .toLowerCase()
        .replace(/[.,!?;:]/g, '')
        .split(/\s+/)
        .slice(0, 4)
      if (words.some(w => SPEECH_VERBS.has(w))) continue
    }

    // Include trailing closing quote in the sentence text when present
    const sentenceEnd = hasTrailingQuote ? idx + 2 : idx + 1
    const sentence = cleaned.slice(start, sentenceEnd).trim()
    if (sentence) sentences.push(sentence)
    start = idx + match[0].length
  }

  // Add remaining text
  const remaining = cleaned.slice(start).trim()
  if (remaining) sentences.push(remaining)

  return sentences.length > 0 ? sentences : [cleaned]
}
