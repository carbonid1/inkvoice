import type { ContentBlock } from '@/lib/types/book'
import { describe, expect, it } from 'vitest'
import { findDuplicateTitleIndex } from './findDuplicateTitleIndex'

const heading = (text: string, level = 1): ContentBlock => ({
  type: 'heading',
  level,
  segments: [{ sentenceIndex: 0, html: text }],
})

const paragraph = (text: string): ContentBlock => ({
  type: 'paragraph',
  segments: [{ sentenceIndex: 0, html: text }],
})

describe('findDuplicateTitleIndex', () => {
  it('returns index of first heading matching title', () => {
    const content = [heading('Chapter One')]
    expect(findDuplicateTitleIndex(content, 'Chapter One')).toBe(0)
  })

  it('finds heading after non-heading blocks', () => {
    const content = [paragraph('https://example.com'), heading('Chapter One')]
    expect(findDuplicateTitleIndex(content, 'Chapter One')).toBe(1)
  })

  it('returns -1 when no heading matches', () => {
    const content = [heading('Different Title'), paragraph('Some text')]
    expect(findDuplicateTitleIndex(content, 'Chapter One')).toBe(-1)
  })

  it('returns -1 for empty content', () => {
    expect(findDuplicateTitleIndex([], 'Chapter One')).toBe(-1)
  })

  it('ignores non-heading blocks with matching text', () => {
    const content = [paragraph('Chapter One'), heading('Other')]
    expect(findDuplicateTitleIndex(content, 'Chapter One')).toBe(-1)
  })

  it('strips HTML tags when comparing', () => {
    const content = [heading('<em>Chapter</em> One')]
    expect(findDuplicateTitleIndex(content, 'Chapter One')).toBe(0)
  })

  it('trims whitespace from title', () => {
    const content = [heading('Chapter One')]
    expect(findDuplicateTitleIndex(content, '  Chapter One  ')).toBe(0)
  })

  it('does not search beyond 5 blocks', () => {
    const content = [
      paragraph('a'),
      paragraph('b'),
      paragraph('c'),
      paragraph('d'),
      paragraph('e'),
      heading('Chapter One'),
    ]
    expect(findDuplicateTitleIndex(content, 'Chapter One')).toBe(-1)
  })

  it('handles blocks without segments', () => {
    const content: ContentBlock[] = [
      { type: 'image', src: 'img.png', alt: 'cover' },
      heading('Chapter One'),
    ]
    expect(findDuplicateTitleIndex(content, 'Chapter One')).toBe(1)
  })
})
