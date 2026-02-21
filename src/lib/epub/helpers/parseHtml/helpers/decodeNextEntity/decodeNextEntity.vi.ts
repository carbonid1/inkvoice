import { describe, expect, it } from 'vitest'
import { decodeNextEntity } from './decodeNextEntity'

describe('decodeNextEntity', () => {
  it('should decode named entities', () => {
    expect(decodeNextEntity('&amp;rest', 0)).toEqual({ char: '&', length: 5 })
    expect(decodeNextEntity('&mdash;x', 0)).toEqual({ char: '\u2014', length: 7 })
    expect(decodeNextEntity('&nbsp;', 0)).toEqual({ char: ' ', length: 6 })
  })

  it('should decode numeric entities', () => {
    expect(decodeNextEntity('&#65;rest', 0)).toEqual({ char: 'A', length: 5 })
    expect(decodeNextEntity('&#8212;x', 0)).toEqual({ char: '\u2014', length: 7 })
  })

  it('should return null for non-entity', () => {
    expect(decodeNextEntity('hello', 0)).toBeNull()
    expect(decodeNextEntity('&unknown;', 0)).toBeNull()
  })

  it('should decode at given position', () => {
    expect(decodeNextEntity('xx&lt;yy', 2)).toEqual({ char: '<', length: 4 })
  })
})
