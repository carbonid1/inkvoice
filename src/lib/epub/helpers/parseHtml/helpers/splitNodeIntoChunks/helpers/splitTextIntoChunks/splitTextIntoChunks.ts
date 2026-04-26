const ABBREVIATIONS = new Set([
  'mr',
  'mrs',
  'ms',
  'dr',
  'st',
  'sr',
  'jr',
  'prof',
  'gen',
  'gov',
  'sgt',
  'cpl',
  'pvt',
  'capt',
  'col',
  'maj',
  'lt',
  'cmdr',
  'adm',
  'rev',
  'hon',
])

const CLOSING_QUOTES = new Set(['"', '\u201D', '\u2019', "'"])

const skipClosingQuote = (text: string, index: number): number =>
  CLOSING_QUOTES.has(text[index] ?? '') ? index + 1 : index

const isSentenceBoundary = (text: string, dotIndex: number): boolean => {
  const terminator = text[dotIndex]

  if (terminator !== '.' && terminator !== '!' && terminator !== '?') return false

  // Must have a space (or closing quote + space) after the terminator
  const afterIndex = skipClosingQuote(text, dotIndex + 1)

  // Must be followed by a space
  if (text[afterIndex] !== ' ') return false

  // Character after space must be uppercase, opening quote, or opening paren
  const nextChar = text[afterIndex + 1]

  if (!nextChar) return false
  if (
    nextChar === '"' ||
    nextChar === '\u201C' ||
    nextChar === '\u2018' ||
    nextChar === '(' ||
    (nextChar >= 'A' && nextChar <= 'Z')
  ) {
    // OK — looks like a new sentence
  } else {
    return false
  }

  // Check for period-specific false positives
  if (terminator === '.') {
    // Single letter initial: "J. K. Rowling"
    if (dotIndex >= 1 && (dotIndex < 2 || text[dotIndex - 2] === ' ')) {
      const prevChar = text[dotIndex - 1]

      if (prevChar && prevChar >= 'A' && prevChar <= 'Z') return false
    }

    // Digit before period: "3. Take the left fork"
    const prevChar = text[dotIndex - 1]

    if (prevChar && prevChar >= '0' && prevChar <= '9') return false

    // Known abbreviations
    let wordStart = dotIndex - 1

    while (wordStart > 0 && text[wordStart - 1] !== ' ') wordStart--
    const word = text.slice(wordStart, dotIndex).toLowerCase()

    if (ABBREVIATIONS.has(word)) return false

    // e.g. / i.e.
    if (dotIndex >= 2) {
      const twoBack = text.slice(dotIndex - 2, dotIndex)

      if (twoBack === 'e.g' || twoBack === 'i.e') return false
    }
  }

  return true
}

export const splitTextIntoChunks = (text: string, maxChars: number): string[] => {
  if (text.length <= maxChars) return [text]

  // Find all sentence boundary positions (index of the space after terminator+quote)
  const boundaries: number[] = []

  for (let i = 0; i < text.length; i++) {
    if (isSentenceBoundary(text, i)) {
      // splitAt is the space between sentences (after optional closing quote)
      boundaries.push(skipClosingQuote(text, i + 1))
    }
  }

  if (boundaries.length === 0) return [text]

  // Greedy: keep extending chunk until next boundary would exceed limit
  const chunks: string[] = []
  let start = 0
  let lastGoodBoundary = -1

  for (const boundary of boundaries) {
    const chunkSoFar = text.slice(start, boundary)

    if (chunkSoFar.length <= maxChars) {
      lastGoodBoundary = boundary
    } else {
      if (lastGoodBoundary > start) {
        chunks.push(text.slice(start, lastGoodBoundary).trim())
        start = lastGoodBoundary + 1
        // Re-evaluate current boundary with new start
        lastGoodBoundary = text.slice(start, boundary).length <= maxChars ? boundary : -1
      } else {
        // Single sentence exceeds limit — include it anyway
        lastGoodBoundary = boundary
      }
    }
  }

  // Handle remaining text after last split
  const remaining = text.slice(start).trim()

  if (remaining.length > maxChars && lastGoodBoundary > start) {
    chunks.push(text.slice(start, lastGoodBoundary).trim())
    chunks.push(text.slice(lastGoodBoundary + 1).trim())
  } else if (remaining) {
    chunks.push(remaining)
  }

  return chunks
}
