import type { EllipsisRange } from '../findEllipsisRanges/findEllipsisRanges'

// After an ellipsis, uppercase or opening quote signals a new sentence
const SENTENCE_START_AFTER_ELLIPSIS = /^[A-Z\u201c\u2018"']/

// Returns true if the period at `dotIndex` is part of an ellipsis and should NOT end a sentence.
// `textAfterWhitespace` is the text following the matched period + whitespace.
export const isEllipsisDot = (
  dotIndex: number,
  ranges: EllipsisRange[],
  textAfterWhitespace: string,
): boolean => {
  const range = ranges.find(r => dotIndex >= r.start && dotIndex < r.end)
  if (!range) return false
  const isLast = dotIndex + 1 >= range.end
  if (!isLast) return true
  // Last dot: only skip if NOT followed by new-sentence start
  return !SENTENCE_START_AFTER_ELLIPSIS.test(textAfterWhitespace)
}
