import { describe, expect, it } from 'vitest'
import type { ContentBlock } from '@/lib/types/book'
import { collectBlockSegments } from './collectBlockSegments'

describe('collectBlockSegments', () => {
  it("should collect a block's own segments", () => {
    const block: ContentBlock = {
      type: 'paragraph',
      segments: [
        { paragraphIndex: 0, html: 'First sentence.' },
        { paragraphIndex: 1, html: 'Second sentence.' },
      ],
    }

    expect(collectBlockSegments(block)).toEqual([
      { paragraphIndex: 0, html: 'First sentence.' },
      { paragraphIndex: 1, html: 'Second sentence.' },
    ])
  })

  it('should flatten list items', () => {
    const block: ContentBlock = {
      type: 'list',
      items: [
        [{ paragraphIndex: 0, html: 'Item one.' }],
        [
          { paragraphIndex: 1, html: 'Item two, first sentence.' },
          { paragraphIndex: 2, html: 'Item two, second sentence.' },
        ],
      ],
    }

    expect(collectBlockSegments(block)).toEqual([
      { paragraphIndex: 0, html: 'Item one.' },
      { paragraphIndex: 1, html: 'Item two, first sentence.' },
      { paragraphIndex: 2, html: 'Item two, second sentence.' },
    ])
  })

  it("should collect table rows' spoken segments", () => {
    const block: ContentBlock = {
      type: 'table',
      rows: [
        {
          segments: [{ paragraphIndex: 0, html: 'Rise from bed, 6 a.m.' }],
          cells: ['Rise from bed', '6 a.m.'],
        },
        { segments: [{ paragraphIndex: 1, html: 'Work, 7 a.m.' }], cells: ['Work', '7 a.m.'] },
      ],
    }

    expect(collectBlockSegments(block)).toEqual([
      { paragraphIndex: 0, html: 'Rise from bed, 6 a.m.' },
      { paragraphIndex: 1, html: 'Work, 7 a.m.' },
    ])
  })

  it('should recurse into nested children of a structured blockquote', () => {
    const block: ContentBlock = {
      type: 'blockquote',
      children: [
        {
          type: 'paragraph',
          isQuoteTitle: true,
          segments: [{ paragraphIndex: 0, html: 'Daily Schedule' }],
        },
        {
          type: 'list',
          items: [[{ paragraphIndex: 1, html: 'Item one.' }]],
        },
        {
          type: 'blockquote',
          children: [
            { type: 'paragraph', segments: [{ paragraphIndex: 2, html: 'Deeply nested.' }] },
          ],
        },
      ],
    }

    expect(collectBlockSegments(block)).toEqual([
      { paragraphIndex: 0, html: 'Daily Schedule' },
      { paragraphIndex: 1, html: 'Item one.' },
      { paragraphIndex: 2, html: 'Deeply nested.' },
    ])
  })

  it('should return an empty array for a block with no text content', () => {
    const block: ContentBlock = { type: 'image', src: 'map.png', alt: 'Map' }

    expect(collectBlockSegments(block)).toEqual([])
  })
})
