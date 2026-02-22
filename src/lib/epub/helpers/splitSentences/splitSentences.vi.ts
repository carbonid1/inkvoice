import { describe, expect, it } from 'vitest'
import { splitIntoSentences } from './splitSentences'

describe('splitIntoSentences', () => {
  describe('spaced ellipsis (. . .)', () => {
    it('keeps spaced ellipsis with lowercase continuation as one sentence', () => {
      const result = splitIntoSentences(
        'Sawark has no choice but to give Beneth more control. . . more knowledge . . .',
      )
      expect(result).toEqual([
        'Sawark has no choice but to give Beneth more control. . . more knowledge . . .',
      ])
    })

    it('splits spaced ellipsis when uppercase follows', () => {
      const result = splitIntoSentences('Something. . . After a long moment, he sighed.')
      expect(result).toEqual(['Something. . .', 'After a long moment, he sighed.'])
    })

    it('keeps dialogue with spaced ellipsis intact', () => {
      const result = splitIntoSentences(
        "He finally spoke, 'When you're up on the rim . . . look south.'",
      )
      expect(result).toEqual(["He finally spoke, 'When you're up on the rim . . . look south.'"])
    })

    it('keeps "Gift . . . or spy." as one sentence', () => {
      const result = splitIntoSentences('Gift . . . or spy.')
      expect(result).toEqual(['Gift . . . or spy.'])
    })

    it('keeps multiple spaced ellipsis continuations together', () => {
      const result = splitIntoSentences('He waited . . . and waited . . . but nothing came.')
      expect(result).toEqual(['He waited . . . and waited . . . but nothing came.'])
    })

    it('handles trailing spaced ellipsis', () => {
      const result = splitIntoSentences('She ran . . .')
      expect(result).toEqual(['She ran . . .'])
    })
  })

  describe('multi-dot ellipsis (...)', () => {
    it('keeps multi-dot with lowercase continuation as one sentence', () => {
      const result = splitIntoSentences('He waited... and waited.')
      expect(result).toEqual(['He waited... and waited.'])
    })

    it('splits multi-dot when uppercase follows', () => {
      const result = splitIntoSentences('Something... After a moment, he sighed.')
      expect(result).toEqual(['Something...', 'After a moment, he sighed.'])
    })

    it('handles trailing multi-dot', () => {
      const result = splitIntoSentences('She ran...')
      expect(result).toEqual(['She ran...'])
    })
  })

  describe('unicode ellipsis (\u2026)', () => {
    it('keeps unicode ellipsis with lowercase continuation', () => {
      const result = splitIntoSentences('He waited\u2026 and waited.')
      expect(result).toEqual(['He waited\u2026 and waited.'])
    })

    it('splits unicode ellipsis when uppercase follows', () => {
      const result = splitIntoSentences('Something\u2026 After a moment.')
      expect(result).toEqual(['Something\u2026', 'After a moment.'])
    })
  })

  describe('existing behavior preserved', () => {
    it('splits regular sentences', () => {
      const result = splitIntoSentences('Hello world. How are you? Fine!')
      expect(result).toEqual(['Hello world.', 'How are you?', 'Fine!'])
    })

    it('preserves abbreviations', () => {
      const result = splitIntoSentences('Dr. Smith went home. He was tired.')
      expect(result).toEqual(['Dr. Smith went home.', 'He was tired.'])
    })

    it('preserves numbers with periods', () => {
      const result = splitIntoSentences('Version 3.14 is out. Get it now.')
      expect(result).toEqual(['Version 3.14 is out.', 'Get it now.'])
    })

    it('handles empty input', () => {
      expect(splitIntoSentences('')).toEqual([])
    })

    it('handles single sentence', () => {
      expect(splitIntoSentences('Hello world')).toEqual(['Hello world'])
    })
  })
})
