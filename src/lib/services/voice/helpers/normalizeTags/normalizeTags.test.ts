import { describe, expect, it } from 'vitest'
import { normalizeTags } from './normalizeTags'

describe('normalizeTags', () => {
  it('lowercases all tags', () => {
    expect(normalizeTags(['Male', 'BRITISH'])).toEqual(['british', 'male'])
  })

  it('trims whitespace', () => {
    expect(normalizeTags([' warm ', '  calm'])).toEqual(['calm', 'warm'])
  })

  it('removes duplicates', () => {
    expect(normalizeTags(['male', 'Male', 'MALE'])).toEqual(['male'])
  })

  it('sorts alphabetically', () => {
    expect(normalizeTags(['warm', 'british', 'male'])).toEqual(['british', 'male', 'warm'])
  })

  it('filters out blank strings', () => {
    expect(normalizeTags(['', '  ', 'warm', ''])).toEqual(['warm'])
  })

  it('returns empty array for empty input', () => {
    expect(normalizeTags([])).toEqual([])
  })
})
