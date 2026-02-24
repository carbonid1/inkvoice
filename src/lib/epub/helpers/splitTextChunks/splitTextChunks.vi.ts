import { describe, expect, it } from 'vitest'
import { splitTextChunks } from './splitTextChunks'

describe('splitTextChunks', () => {
  describe('sentence mode', () => {
    describe('spaced ellipsis (. . .)', () => {
      it('keeps spaced ellipsis with lowercase continuation as one sentence', () => {
        const result = splitTextChunks(
          'Sawark has no choice but to give Beneth more control. . . more knowledge . . .',
        )
        expect(result).toEqual([
          'Sawark has no choice but to give Beneth more control. . . more knowledge . . .',
        ])
      })

      it('splits spaced ellipsis when uppercase follows', () => {
        const result = splitTextChunks('Something. . . After a long moment, he sighed.')
        expect(result).toEqual(['Something. . .', 'After a long moment, he sighed.'])
      })

      it('keeps dialogue with spaced ellipsis intact', () => {
        const result = splitTextChunks(
          "He finally spoke, 'When you're up on the rim . . . look south.'",
        )
        expect(result).toEqual(["He finally spoke, 'When you're up on the rim . . . look south.'"])
      })

      it('keeps "Gift . . . or spy." as one sentence', () => {
        const result = splitTextChunks('Gift . . . or spy.')
        expect(result).toEqual(['Gift . . . or spy.'])
      })

      it('keeps multiple spaced ellipsis continuations together', () => {
        const result = splitTextChunks('He waited . . . and waited . . . but nothing came.')
        expect(result).toEqual(['He waited . . . and waited . . . but nothing came.'])
      })

      it('handles trailing spaced ellipsis', () => {
        const result = splitTextChunks('She ran . . .')
        expect(result).toEqual(['She ran . . .'])
      })
    })

    describe('multi-dot ellipsis (...)', () => {
      it('keeps multi-dot with lowercase continuation as one sentence', () => {
        const result = splitTextChunks('He waited... and waited.')
        expect(result).toEqual(['He waited... and waited.'])
      })

      it('splits multi-dot when uppercase follows', () => {
        const result = splitTextChunks('Something... After a moment, he sighed.')
        expect(result).toEqual(['Something...', 'After a moment, he sighed.'])
      })

      it('handles trailing multi-dot', () => {
        const result = splitTextChunks('She ran...')
        expect(result).toEqual(['She ran...'])
      })
    })

    describe('unicode ellipsis (\u2026)', () => {
      it('keeps unicode ellipsis with lowercase continuation', () => {
        const result = splitTextChunks('He waited\u2026 and waited.')
        expect(result).toEqual(['He waited\u2026 and waited.'])
      })

      it('splits unicode ellipsis when uppercase follows', () => {
        const result = splitTextChunks('Something\u2026 After a moment.')
        expect(result).toEqual(['Something\u2026', 'After a moment.'])
      })
    })

    describe('dialogue attribution after closing quote', () => {
      it('keeps dialogue with attribution as one sentence', () => {
        const result = splitTextChunks("'Why are you here?' he whispered. 'Do you know why?")
        expect(result).toEqual(["'Why are you here?' he whispered.", "'Do you know why?"])
      })

      it('splits at closing quote when followed by uppercase (new sentence)', () => {
        const result = splitTextChunks("'Are you sure?' The door opened.")
        expect(result).toEqual(["'Are you sure?'", 'The door opened.'])
      })

      it('preserves closing quote with exclamation', () => {
        const result = splitTextChunks("'Watch out!' She turned and ran.")
        expect(result).toEqual(["'Watch out!'", 'She turned and ran.'])
      })

      it('keeps exclamation attribution as one sentence', () => {
        const result = splitTextChunks("'Watch out!' she screamed. 'Run!'")
        expect(result).toEqual(["'Watch out!' she screamed.", "'Run!'"])
      })

      it('handles period + closing quote + attribution', () => {
        const result = splitTextChunks("'I shall get you food and drink, then.' he muttered.")
        expect(result).toEqual(["'I shall get you food and drink, then.' he muttered."])
      })

      it('splits period + closing quote when uppercase follows', () => {
        const result = splitTextChunks("'I shall get you food and drink, then.' Mappo left.")
        expect(result).toEqual(["'I shall get you food and drink, then.'", 'Mappo left.'])
      })

      it('keeps dialogue with proper noun subject + speech verb as one sentence', () => {
        const result = splitTextChunks("'And you?' Fiddler asked.")
        expect(result).toEqual(["'And you?' Fiddler asked."])
      })
    })

    describe('existing behavior preserved', () => {
      it('splits regular sentences', () => {
        const result = splitTextChunks('Hello world. How are you? Fine!')
        expect(result).toEqual(['Hello world.', 'How are you?', 'Fine!'])
      })

      it('preserves abbreviations', () => {
        const result = splitTextChunks('Dr. Smith went home. He was tired.')
        expect(result).toEqual(['Dr. Smith went home.', 'He was tired.'])
      })

      it('preserves numbers with periods', () => {
        const result = splitTextChunks('Version 3.14 is out. Get it now.')
        expect(result).toEqual(['Version 3.14 is out.', 'Get it now.'])
      })

      it('handles empty input', () => {
        expect(splitTextChunks('')).toEqual([])
      })

      it('handles single sentence', () => {
        expect(splitTextChunks('Hello world')).toEqual(['Hello world'])
      })
    })
  })

  describe('paragraph mode', () => {
    it('returns entire text as single chunk', () => {
      const result = splitTextChunks('Hello world. How are you? Fine!', 'paragraph')
      expect(result).toEqual(['Hello world. How are you? Fine!'])
    })

    it('handles empty input', () => {
      expect(splitTextChunks('', 'paragraph')).toEqual([])
    })

    it('normalizes whitespace', () => {
      const result = splitTextChunks('Hello   world.\n  How are you?', 'paragraph')
      expect(result).toEqual(['Hello world. How are you?'])
    })
  })
})
