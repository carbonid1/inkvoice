import { describe, expect, it } from 'vitest'
import { normalizeTags } from './normalizeTags'

describe('normalizeTags', () => {
  it('lowercases all tags', () => {
    expect(normalizeTags(['Male', 'BRITISH'])).toEqual(['male', 'british'])
  })

  it('trims whitespace', () => {
    expect(normalizeTags([' warm ', '  calm'])).toEqual(['warm', 'calm'])
  })

  it('removes duplicates', () => {
    expect(normalizeTags(['male', 'Male', 'MALE'])).toEqual(['male'])
  })

  it('preserves input order', () => {
    expect(normalizeTags(['warm', 'british', 'male'])).toEqual(['warm', 'british', 'male'])
  })

  it('filters out blank strings', () => {
    expect(normalizeTags(['', '  ', 'warm', ''])).toEqual(['warm'])
  })

  it('returns empty array for empty input', () => {
    expect(normalizeTags([])).toEqual([])
  })
})
