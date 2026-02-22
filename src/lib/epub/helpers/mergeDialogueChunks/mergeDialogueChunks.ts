import {
  MAX_ATTRIBUTION_TAIL_LENGTH,
  MAX_MERGED_LENGTH,
  SPEECH_VERBS,
} from './mergeDialogueChunks.consts'

const OPENING_QUOTE_PATTERN = /["'\u201c\u2018]/

/**
 * Checks whether the character at `idx` is a closing quotation mark
 * (as opposed to an apostrophe inside a contraction like "can't").
 *
 * Straight single quotes are only treated as closing quotes when the
 * next character is NOT a letter — apostrophes inside words are skipped.
 */
const isClosingQuote = (text: string, idx: number): boolean => {
  const char = text[idx]
  if (char === '"' || char === '\u201d') return true
  if (char === "'" || char === '\u2019') {
    const next = text[idx + 1]
    // Apostrophe inside a word: followed by a letter
    if (next !== undefined && /[a-zA-Z]/.test(next)) return false
    return true
  }
  return false
}

/**
 * Detects whether a sentence ends with a dialogue attribution tag.
 *
 * Looks for a closing quotation mark followed by a short tail
 * containing a speech verb (said, asked, whispered, etc.).
 *
 * Examples that return true:
 *   `"I'm leaving," he said.`
 *   `"Watch out!" she screamed.`
 *   `"Are you sure?" he asked quietly.`
 */
export const endsWithAttribution = (sentence: string): boolean => {
  let lastQuoteIdx = -1
  for (let i = sentence.length - 1; i >= 0; i--) {
    if (isClosingQuote(sentence, i)) {
      lastQuoteIdx = i
      break
    }
  }
  if (lastQuoteIdx === -1) return false

  const tail = sentence.slice(lastQuoteIdx + 1).trim()
  if (!tail || tail.length > MAX_ATTRIBUTION_TAIL_LENGTH) return false

  const words = tail
    .toLowerCase()
    .replace(/[.,!?;:]/g, '')
    .split(/\s+/)
  return words.some(w => SPEECH_VERBS.has(w))
}

/**
 * Checks whether a sentence starts with a quotation mark.
 */
export const startsWithQuote = (sentence: string): boolean => {
  const first = sentence.trimStart()[0]
  return first !== undefined && OPENING_QUOTE_PATTERN.test(first)
}

/**
 * Merges adjacent sentences when a dialogue attribution tag sits between
 * two quoted segments, producing a single continuous TTS chunk.
 *
 * Before: `["\"I'm leaving,\" he said.", "\"Don't follow me.\""]`
 * After:  `["\"I'm leaving,\" he said. \"Don't follow me.\""]`
 *
 * Chains are merged greedily up to `MAX_MERGED_LENGTH` characters.
 * Non-dialogue sentences pass through unchanged.
 */
export const mergeDialogueChunks = (sentences: string[]): string[] => {
  if (sentences.length <= 1) return sentences

  const result: string[] = []
  let i = 0

  while (i < sentences.length) {
    let merged = sentences[i]!

    while (
      i + 1 < sentences.length &&
      endsWithAttribution(merged) &&
      startsWithQuote(sentences[i + 1]!) &&
      merged.length + 1 + sentences[i + 1]!.length <= MAX_MERGED_LENGTH
    ) {
      merged = merged + ' ' + sentences[i + 1]!
      i++
    }

    result.push(merged)
    i++
  }

  return result
}
