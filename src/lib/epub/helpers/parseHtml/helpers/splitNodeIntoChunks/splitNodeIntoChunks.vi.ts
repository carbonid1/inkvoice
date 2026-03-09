import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { splitNodeIntoChunks } from './splitNodeIntoChunks'

const makeElement = (html: string): Element => {
  const dom = new JSDOM(html)
  return dom.window.document.body.firstElementChild!
}

describe('splitNodeIntoChunks', () => {
  it('returns entire paragraph as single chunk', () => {
    const el = makeElement('<p>First sentence. Second sentence. Third sentence.</p>')
    const result = splitNodeIntoChunks(el)

    expect(result).toHaveLength(1)
    expect(result[0]?.plainText).toBe('First sentence. Second sentence. Third sentence.')
  })

  it('preserves all HTML in single chunk', () => {
    const el = makeElement('<p>She walked <em>fourteen leagues</em> north. Then she rested.</p>')
    const result = splitNodeIntoChunks(el)

    expect(result).toHaveLength(1)
    expect(result[0]?.html).toContain('<em>')
    expect(result[0]?.plainText).toBe('She walked fourteen leagues north. Then she rested.')
  })

  it('returns empty array for empty node', () => {
    const el = makeElement('<p>   </p>')
    const result = splitNodeIntoChunks(el)

    expect(result).toHaveLength(0)
  })

  it('splits long paragraph into multiple chunks with aligned plain text and HTML', () => {
    const sentences = Array.from(
      { length: 10 },
      (_, i) =>
        `Sentence number ${i + 1} continues with enough words to make it reasonably long for testing purposes.`,
    )
    const el = makeElement(`<p>${sentences.join(' ')}</p>`)
    const result = splitNodeIntoChunks(el)

    expect(result.length).toBeGreaterThan(1)
    // All plain text concatenated should equal original
    const combined = result.map(c => c.plainText).join(' ')
    expect(combined).toBe(sentences.join(' '))
    // Each chunk's plain text should be within limit
    result.forEach(chunk => expect(chunk.plainText.length).toBeLessThanOrEqual(500))
  })

  it('splits the large epub passage with correct HTML slices', () => {
    const passage =
      'The flesh and blood Series Army was being torn apart from the inside. The wounds were ' +
      'spreading, a rot that fed on the most honorable of virtues: loyalty and duty. The warriors ' +
      'had a way of delivering <em>unquestioned</em> justice. Greed was punished, as was stupidity and most ' +
      'of all incompetence. The old guard had built an army capable of conquering the world, but the ' +
      'rot was cancerous. Too many of the Empire\u2019s young had already been fed to this war. ' +
      'Victories meant nothing if there was no one left to hold the ground that had been won.'
    const el = makeElement(`<p>${passage}</p>`)
    const result = splitNodeIntoChunks(el)

    expect(result.length).toBe(2)
    expect(result[0]?.html).toContain('<em>unquestioned</em>')
    expect(result[0]?.plainText).toContain('unquestioned')
    // Verify chunks reconstruct the full text
    const combined = result.map(c => c.plainText).join(' ')
    expect(combined).toBe(passage.replace(/<[^>]+>/g, ''))
  })
})
