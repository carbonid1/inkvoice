const ROMAN_NUMERAL_RE = /^[IVXLCDM]+$/i
const BARE_NUMBER_RE = /^\d{1,3}$/

/**
 * Detect bare chapter markers (Roman numerals like "II", "XIV" or
 * plain numbers like "3", "18") that should be excluded from TTS.
 */
export const isChapterMarker = (text: string): boolean => {
  const trimmed = text.trim()

  return ROMAN_NUMERAL_RE.test(trimmed) || BARE_NUMBER_RE.test(trimmed)
}
