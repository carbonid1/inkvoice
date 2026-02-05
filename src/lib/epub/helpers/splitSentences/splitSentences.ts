import { ABBREVIATIONS } from '../../epub.consts'

export const isValidSentenceEnd = (text: string, index: number): boolean => {
  // Get word ending at this period
  let start = index - 1
  while (start >= 0 && !/\s/.test(text[start])) start--
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

export const splitIntoSentences = (text: string): string[] => {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return []

  const sentences: string[] = []
  let start = 0

  // Match all potential sentence endings: .!? optionally followed by quotes, then whitespace
  const endPattern = /[.!?]["'\u201d\u2019]?\s+/g
  let match

  while ((match = endPattern.exec(cleaned)) !== null) {
    const punctIndex = match.index
    const punctChar = cleaned[punctIndex]

    // ! and ? are always sentence endings
    // . needs validation for abbreviations and numbers
    if (punctChar === '.' && !isValidSentenceEnd(cleaned, punctIndex)) {
      continue
    }

    const sentence = cleaned.slice(start, match.index + 1).trim()
    if (sentence) sentences.push(sentence)
    start = match.index + match[0].length
  }

  // Add remaining text
  const remaining = cleaned.slice(start).trim()
  if (remaining) sentences.push(remaining)

  return sentences.length > 0 ? sentences : [cleaned]
}
