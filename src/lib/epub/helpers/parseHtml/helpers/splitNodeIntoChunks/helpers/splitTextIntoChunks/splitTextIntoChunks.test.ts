import { describe, expect, it } from 'vitest'
import { splitTextIntoChunks } from './splitTextIntoChunks'

describe('splitTextIntoChunks', () => {
  it('returns short text as single chunk', () => {
    const text = 'A short sentence.'
    expect(splitTextIntoChunks(text, 500)).toEqual([text])
  })

  it('splits long paragraph into chunks at sentence boundaries', () => {
    const sentences = [
      'The army marched through the desert for fourteen days without rest.',
      'Soldiers collapsed in the heat, their armor burning against skin.',
      'Water rations had been halved three days prior by command of the Fist.',
      'The sappers worked through each night to clear the road of rubble.',
      'By dawn the column would resume its slow grinding advance northward.',
      'Dust storms obscured the horizon and filled lungs with powdered glass.',
      'Too many of the Empire\u2019s young had already been fed to this campaign.',
    ]
    const text = sentences.join(' ')

    const result = splitTextIntoChunks(text, 300)

    expect(result.length).toBe(2)
    result.forEach(chunk => expect(chunk.length).toBeLessThanOrEqual(300))
    expect(result.join(' ')).toBe(text)
  })

  it('splits the large epub passage into two chunks', () => {
    const text =
      'The flesh and blood Series Army was being torn apart from the inside. The wounds were ' +
      'spreading, a rot that fed on the most honorable of virtues: loyalty and duty. The warriors ' +
      'had a way of delivering unquestioned justice. Greed was punished, as was stupidity and most ' +
      'of all incompetence. The old guard had built an army capable of conquering the world, but the ' +
      'rot was cancerous. Too many of the Empire\u2019s young had already been fed to this war. ' +
      'Victories meant nothing if there was no one left to hold the ground that had been won.'

    const result = splitTextIntoChunks(text, 500)

    expect(result.length).toBe(2)
    result.forEach(chunk => expect(chunk.length).toBeLessThanOrEqual(500))
    expect(result[1]).toMatch(/^Victories meant nothing/)
    expect(result.join(' ')).toBe(text)
  })

  it('returns unsplittable text as single chunk when no sentence boundaries exist', () => {
    const text = 'a'.repeat(600)
    expect(splitTextIntoChunks(text, 500)).toEqual([text])
  })

  it('splits text just over limit at the one available boundary', () => {
    // ~260 + ~260 = ~520 with one boundary in the middle
    const first = 'A'.repeat(255) + '.'
    const second = 'B'.repeat(255) + '.'
    const text = `${first} ${second}`

    const result = splitTextIntoChunks(text, 500)

    expect(result.length).toBe(2)
    expect(result[0]).toBe(first)
    expect(result[1]).toBe(second)
  })

  it('does not split at abbreviations', () => {
    const text =
      'Dr. Smith walked into the room and greeted Mr. Jones who had been ' +
      'waiting for hours. ' +
      'The meeting, e.g. the quarterly review, was about to begin and everyone took their seats.'
    // Total ~170 chars — under any reasonable limit, but let's set limit low to force it
    // to try splitting. The abbreviation periods should NOT be valid boundaries.
    const result = splitTextIntoChunks(text, 100)

    // Should split at "waiting for hours." not at "Dr." or "Mr." or "e.g."
    expect(result[0]).toMatch(/waiting for hours\.$/)
    expect(result.join(' ')).toBe(text)
  })

  it('splits after closing quotes at sentence boundaries', () => {
    const text =
      '"I will not yield," she whispered. "This changes nothing." ' +
      'He turned away without a word and disappeared into the darkened corridor beyond the gate.'

    const result = splitTextIntoChunks(text, 60)

    // Should be able to split between quoted sentences
    expect(result.length).toBeGreaterThanOrEqual(2)
    expect(result.join(' ')).toBe(text)
  })
})
