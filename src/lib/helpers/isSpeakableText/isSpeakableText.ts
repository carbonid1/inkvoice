/**
 * Whether TTS can produce audible speech for this text: true when it contains
 * at least one letter or digit in any script. Decorative strings ("———",
 * "* * *", "???") are unspeakable — synthesizing them yields silence, so
 * callers must skip TTS for them instead of waiting on audio that never comes.
 */
export const isSpeakableText = (text: string): boolean => /[\p{L}\p{N}]/u.test(text)
