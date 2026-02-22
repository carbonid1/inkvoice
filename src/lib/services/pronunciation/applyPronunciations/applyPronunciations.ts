import type { PronunciationMap } from '../pronunciation.types'

export const applyPronunciations = (text: string, map: PronunciationMap): string => {
  const entries = Object.entries(map)
  if (entries.length === 0) return text

  return entries.reduce((result, [word, replacement]) => {
    const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    return result.replace(pattern, replacement)
  }, text)
}
