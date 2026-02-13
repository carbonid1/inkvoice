import { describe, expect, it } from 'vitest'
import { applyPronunciations } from './applyPronunciations'

describe('applyPronunciations', () => {
  it('replaces a word with its pronunciation', () => {
    expect(applyPronunciations('Baudin walked east', { Baudin: 'Baw-din' })).toBe(
      'Baw-din walked east',
    )
  })

  it('handles possessives', () => {
    expect(
      applyPronunciations("Baudin's sword was sharp", { Baudin: 'Baw-din' }),
    ).toBe("Baw-din's sword was sharp")
  })

  it('is case-insensitive', () => {
    expect(applyPronunciations('baudin and BAUDIN', { Baudin: 'Baw-din' })).toBe(
      'Baw-din and Baw-din',
    )
  })

  it('replaces multiple different words', () => {
    expect(
      applyPronunciations('Baudin met Nynaeve', {
        Baudin: 'Baw-din',
        Nynaeve: 'Nigh-neev',
      }),
    ).toBe('Baw-din met Nigh-neev')
  })

  it('does not replace partial word matches', () => {
    expect(applyPronunciations('Baudinger walked', { Baudin: 'Baw-din' })).toBe(
      'Baudinger walked',
    )
  })

  it('returns text unchanged with empty map', () => {
    expect(applyPronunciations('Hello world', {})).toBe('Hello world')
  })

  it('handles multiple occurrences', () => {
    expect(
      applyPronunciations('Baudin saw Baudin', { Baudin: 'Baw-din' }),
    ).toBe('Baw-din saw Baw-din')
  })

  it('does not break on regex special characters in keys', () => {
    expect(
      applyPronunciations('Price is $100 today', { '$100': 'one hundred' }),
    ).toBe('Price is $100 today')
  })

  it('handles word at start of text', () => {
    expect(applyPronunciations('Baudin spoke', { Baudin: 'Baw-din' })).toBe(
      'Baw-din spoke',
    )
  })

  it('handles word at end of text', () => {
    expect(applyPronunciations('I see Baudin', { Baudin: 'Baw-din' })).toBe(
      'I see Baw-din',
    )
  })

  it('handles punctuation after word', () => {
    expect(applyPronunciations('Baudin, come here.', { Baudin: 'Baw-din' })).toBe(
      'Baw-din, come here.',
    )
  })
})
