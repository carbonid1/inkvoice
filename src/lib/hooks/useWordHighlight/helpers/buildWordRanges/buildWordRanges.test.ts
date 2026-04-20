/**
 * @vitest-environment jsdom
 */
import type { WordTimestamp } from '@/lib/types/wordTimestamp'
import { describe, expect, it } from 'vitest'
import { buildWordRanges } from './buildWordRanges'

const makeElement = (html: string): HTMLElement => {
  const el = document.createElement('span')
  el.innerHTML = html
  return el
}

const ts = (w: string, s: number, e: number): WordTimestamp => ({ w, s, e })

describe('buildWordRanges', () => {
  it('returns empty array for empty timestamps', () => {
    const el = makeElement('Hello world')
    expect(buildWordRanges(el, [])).toEqual([])
  })

  it('returns empty array for empty element', () => {
    const el = makeElement('')
    expect(buildWordRanges(el, [ts('Hello', 0, 0.3)])).toEqual([])
  })

  it('maps plain text words to ranges', () => {
    const el = makeElement('Hello world test')
    const ranges = buildWordRanges(el, [
      ts('Hello', 0, 0.3),
      ts('world', 0.35, 0.7),
      ts('test', 0.75, 1.0),
    ])

    expect(ranges).toHaveLength(3)
    expect(ranges[0]?.toString()).toBe('Hello')
    expect(ranges[1]?.toString()).toBe('world')
    expect(ranges[2]?.toString()).toBe('test')
  })

  it('handles inline <em> tag with multiple text nodes', () => {
    const el = makeElement('She felt <em>absolutely</em> certain')
    const ranges = buildWordRanges(el, [
      ts('She', 0, 0.2),
      ts('felt', 0.25, 0.5),
      ts('absolutely', 0.55, 0.9),
      ts('certain', 0.95, 1.2),
    ])

    expect(ranges).toHaveLength(4)
    expect(ranges[0]?.toString()).toBe('She')
    expect(ranges[2]?.toString()).toBe('absolutely')
    expect(ranges[3]?.toString()).toBe('certain')
  })

  it('handles cross-node word spanning a tag boundary', () => {
    // "un" is plain text, "believable" is inside <em>
    const el = makeElement('un<em>believable</em> stuff')
    const ranges = buildWordRanges(el, [ts('unbelievable', 0, 0.8), ts('stuff', 0.85, 1.0)])

    expect(ranges).toHaveLength(2)
    expect(ranges[0]?.toString()).toBe('unbelievable')
    expect(ranges[1]?.toString()).toBe('stuff')
  })

  it('handles punctuation attached to words', () => {
    const el = makeElement('Hello, world! "Test"')
    const ranges = buildWordRanges(el, [
      ts('Hello,', 0, 0.3),
      ts('world!', 0.35, 0.7),
      ts('"Test"', 0.75, 1.0),
    ])

    expect(ranges).toHaveLength(3)
    expect(ranges[0]?.toString()).toBe('Hello,')
    expect(ranges[1]?.toString()).toBe('world!')
  })

  it('handles em-dash attached to word', () => {
    const el = makeElement('naught but delusions\u2014\u2019')
    const ranges = buildWordRanges(el, [
      ts('naught', 0, 0.3),
      ts('but', 0.35, 0.5),
      ts('delusions\u2014\u2019', 0.55, 1.0),
    ])

    expect(ranges).toHaveLength(3)
    expect(ranges[0]?.toString()).toBe('naught')
    expect(ranges[1]?.toString()).toBe('but')
    expect(ranges[2]?.toString()).toBe('delusions\u2014\u2019')
  })

  it('handles smart quotes around words', () => {
    const el = makeElement('\u2018You know nothing!\u2019 she hissed')
    const ranges = buildWordRanges(el, [
      ts('\u2018You', 0, 0.2),
      ts('know', 0.25, 0.45),
      ts('nothing!\u2019', 0.5, 0.8),
      ts('she', 0.85, 0.95),
      ts('hissed', 1.0, 1.3),
    ])

    expect(ranges).toHaveLength(5)
    expect(ranges[0]?.toString()).toBe('\u2018You')
    expect(ranges[2]?.toString()).toBe('nothing!\u2019')
    expect(ranges[4]?.toString()).toBe('hissed')
  })

  it('handles comma followed by closing quote', () => {
    const el = makeElement('know what I feel? You presumptuous bastard, Heboric\u2014\u2019')
    const ranges = buildWordRanges(el, [
      ts('know', 0, 0.2),
      ts('what', 0.25, 0.4),
      ts('I', 0.45, 0.5),
      ts('feel?', 0.55, 0.7),
      ts('You', 0.75, 0.85),
      ts('presumptuous', 0.9, 1.2),
      ts('bastard,', 1.25, 1.5),
      ts('Heboric\u2014\u2019', 1.55, 1.9),
    ])

    expect(ranges).toHaveLength(8)
    expect(ranges[0]?.toString()).toBe('know')
    expect(ranges[5]?.toString()).toBe('presumptuous')
    expect(ranges[6]?.toString()).toBe('bastard,')
    expect(ranges[7]?.toString()).toBe('Heboric\u2014\u2019')
  })

  it('matches all words in a long paragraph with mixed punctuation', () => {
    const text =
      'The city\u2019s main street was a dusty mosaic of shattered pottery: red-glazed body sherds, grey, black and brown rims.'
    const el = makeElement(text)
    const words = text.split(/\s+/)
    const timestamps = words.map((w, i) => ts(w, i * 0.3, (i + 1) * 0.3))
    const ranges = buildWordRanges(el, timestamps)

    const nullCount = ranges.filter(r => r === null).length
    expect(nullCount).toBe(0)
    expect(ranges[0]?.toString()).toBe('The')
    expect(ranges[words.length - 1]?.toString()).toBe('rims.')
  })

  it('produces valid ranges when rebuilt after innerHTML re-application', () => {
    const html = 'She felt <em>absolutely</em> certain about it.'
    const el = makeElement(html)

    const words = [
      ts('She', 0, 0.2),
      ts('felt', 0.25, 0.5),
      ts('absolutely', 0.55, 0.9),
      ts('certain', 0.95, 1.1),
      ts('about', 1.15, 1.3),
      ts('it.', 1.35, 1.5),
    ]

    const ranges1 = buildWordRanges(el, words)
    expect(ranges1[0]?.toString()).toBe('She')
    expect(ranges1[2]?.toString()).toBe('absolutely')

    // Simulate React re-render: re-apply same innerHTML
    el.innerHTML = html

    // Rebuild produces valid ranges from the new text nodes
    const ranges2 = buildWordRanges(el, words)
    expect(ranges2).toHaveLength(6)
    expect(ranges2.filter(r => r !== null)).toHaveLength(6)
    expect(ranges2[0]?.toString()).toBe('She')
    expect(ranges2[2]?.toString()).toBe('absolutely')
    expect(ranges2[5]?.toString()).toBe('it.')

    // New ranges reference different text nodes than the originals
    expect(ranges2[0]?.startContainer).not.toBe(ranges1[0]?.startContainer)
  })

  it('matches words case-insensitively (normalizeCaps title)', () => {
    const el = makeElement('Chapter Sixteen')
    const ranges = buildWordRanges(el, [ts('CHAPTER', 0, 0.5), ts('SIXTEEN', 0.6, 1.0)])

    expect(ranges).toHaveLength(2)
    expect(ranges[0]?.toString()).toBe('Chapter')
    expect(ranges[1]?.toString()).toBe('Sixteen')
  })

  it('sets null for words not found in text, preserving indices', () => {
    const el = makeElement('Hello world')
    const ranges = buildWordRanges(el, [
      ts('Hello', 0, 0.3),
      ts('MISSING', 0.35, 0.5),
      ts('world', 0.55, 0.7),
    ])

    expect(ranges).toHaveLength(3)
    expect(ranges[0]?.toString()).toBe('Hello')
    expect(ranges[1]).toBeNull()
    expect(ranges[2]?.toString()).toBe('world')
  })
})
