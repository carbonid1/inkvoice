import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { splitNodeIntoChunks } from './splitNodeIntoChunks'

const makeElement = (html: string): Element => {
  const dom = new JSDOM(html)
  return dom.window.document.body.firstElementChild!
}

describe('splitNodeIntoChunks', () => {
  describe('sentence mode', () => {
    it('should return single mapping for one sentence', () => {
      const el = makeElement('<p>Hello brave world.</p>')
      const result = splitNodeIntoChunks(el)

      expect(result).toHaveLength(1)
      expect(result[0]?.plainText).toBe('Hello brave world.')
    })

    it('should split multiple sentences', () => {
      const el = makeElement('<p>First sentence. Second sentence.</p>')
      const result = splitNodeIntoChunks(el)

      expect(result.length).toBeGreaterThanOrEqual(2)
      expect(result[0]?.plainText).toContain('First sentence.')
    })

    it('should return empty array for empty node', () => {
      const el = makeElement('<p>   </p>')
      const result = splitNodeIntoChunks(el)

      expect(result).toHaveLength(0)
    })

    it('keeps dialogue attribution with closing quote as one sentence', () => {
      const el = makeElement(
        '<p>Iskaral Pust eased back into the chamber. &#x2018;Why are you here?&#x2019; he whispered. &#x2018;Do you know why?</p>',
      )
      const result = splitNodeIntoChunks(el)

      expect(result).toHaveLength(2)
      expect(result[0]?.plainText).toBe('Iskaral Pust eased back into the chamber.')
      expect(result[1]?.plainText).toBe(
        '\u2018Why are you here?\u2019 he whispered. \u2018Do you know why?',
      )
    })

    it('should preserve HTML across sentence boundaries', () => {
      const el = makeElement('<p>She walked <em>fourteen leagues</em> north. Then she rested.</p>')
      const result = splitNodeIntoChunks(el)

      expect(result.length).toBeGreaterThanOrEqual(2)
      expect(result[0]?.html).toContain('<em>')
    })

    it('preserves italic tag when it wraps the last sentence', () => {
      const el = makeElement(
        '<p>Mappo left the small room, the combination raising an echo that brought Kalam to mind. <i>Did you outrun the storm, old friend?</i></p>',
      )
      const result = splitNodeIntoChunks(el)

      expect(result).toHaveLength(2)
      expect(result[1]?.html).toBe('<i>Did you outrun the storm, old friend?</i>')
    })

    it('preserves nested tags across sentence boundary', () => {
      const el = makeElement('<p>He paused. <strong><em>This was important.</em></strong></p>')
      const result = splitNodeIntoChunks(el)

      expect(result).toHaveLength(2)
      expect(result[1]?.html).toBe('<strong><em>This was important.</em></strong>')
    })
  })

  describe('paragraph mode', () => {
    it('returns entire paragraph as single chunk', () => {
      const el = makeElement('<p>First sentence. Second sentence. Third sentence.</p>')
      const result = splitNodeIntoChunks(el, 'paragraph')

      expect(result).toHaveLength(1)
      expect(result[0]?.plainText).toBe('First sentence. Second sentence. Third sentence.')
    })

    it('preserves all HTML in single chunk', () => {
      const el = makeElement('<p>She walked <em>fourteen leagues</em> north. Then she rested.</p>')
      const result = splitNodeIntoChunks(el, 'paragraph')

      expect(result).toHaveLength(1)
      expect(result[0]?.html).toContain('<em>')
      expect(result[0]?.plainText).toBe('She walked fourteen leagues north. Then she rested.')
    })

    it('returns empty array for empty node', () => {
      const el = makeElement('<p>   </p>')
      const result = splitNodeIntoChunks(el, 'paragraph')

      expect(result).toHaveLength(0)
    })
  })
})
