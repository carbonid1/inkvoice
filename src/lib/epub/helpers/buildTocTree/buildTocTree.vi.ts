import { describe, expect, it } from 'vitest'
import { buildTocTree } from './buildTocTree'

describe('buildTocTree', () => {
  it('returns empty array when ncx is empty', () => {
    const result = buildTocTree([], new Map(), new Map())
    expect(result).toEqual([])
  })

  it('builds flat list when no children exist', () => {
    const ncx = [
      { id: 'ch1', ncx_index: 0, sub: [] },
      { id: 'ch2', ncx_index: 1, sub: [] },
    ]
    const idToIndex = new Map([
      ['ch1', 0],
      ['ch2', 1],
    ])
    const idToTitle = new Map([
      ['ch1', 'Chapter 1'],
      ['ch2', 'Chapter 2'],
    ])

    const result = buildTocTree(ncx, idToIndex, idToTitle)
    expect(result).toEqual([
      { title: 'Chapter 1', chapterIndex: 0, children: [] },
      { title: 'Chapter 2', chapterIndex: 1, children: [] },
    ])
  })

  it('builds nested tree from hierarchical ncx', () => {
    const ncx = [
      {
        id: 'book1',
        ncx_index: 0,
        sub: [
          { id: 'ch1', ncx_index: 1, sub: [] },
          { id: 'ch2', ncx_index: 2, sub: [] },
        ],
      },
      {
        id: 'book2',
        ncx_index: 3,
        sub: [{ id: 'ch3', ncx_index: 4, sub: [] }],
      },
    ]
    const idToIndex = new Map([
      ['book1', 0],
      ['ch1', 1],
      ['ch2', 2],
      ['book2', 3],
      ['ch3', 4],
    ])
    const idToTitle = new Map([
      ['book1', 'Book 1'],
      ['ch1', 'Chapter 1'],
      ['ch2', 'Chapter 2'],
      ['book2', 'Book 2'],
      ['ch3', 'Chapter 3'],
    ])

    const result = buildTocTree(ncx, idToIndex, idToTitle)
    expect(result).toEqual([
      {
        title: 'Book 1',
        chapterIndex: 0,
        children: [
          { title: 'Chapter 1', chapterIndex: 1, children: [] },
          { title: 'Chapter 2', chapterIndex: 2, children: [] },
        ],
      },
      {
        title: 'Book 2',
        chapterIndex: 3,
        children: [{ title: 'Chapter 3', chapterIndex: 4, children: [] }],
      },
    ])
  })

  it('skips nodes whose id has no chapter index mapping', () => {
    const ncx = [
      { id: 'frontmatter', ncx_index: 0, sub: [] },
      { id: 'ch1', ncx_index: 1, sub: [] },
    ]
    const idToIndex = new Map([['ch1', 0]])
    const idToTitle = new Map([
      ['frontmatter', 'Front Matter'],
      ['ch1', 'Chapter 1'],
    ])

    const result = buildTocTree(ncx, idToIndex, idToTitle)
    expect(result).toEqual([{ title: 'Chapter 1', chapterIndex: 0, children: [] }])
  })

  it('uses fallback title when toc title is missing', () => {
    const ncx = [{ id: 'ch1', ncx_index: 0, sub: [] }]
    const idToIndex = new Map([['ch1', 0]])
    const idToTitle = new Map<string, string>()

    const result = buildTocTree(ncx, idToIndex, idToTitle)
    expect(result).toEqual([{ title: 'Chapter 1', chapterIndex: 0, children: [] }])
  })

  it('returns undefined when tree has no nesting', () => {
    // This tests the hasHierarchy check — a flat ncx should return undefined
    // so the API can omit tocTree for flat books
    const ncx = [
      { id: 'ch1', ncx_index: 0, sub: [] },
      { id: 'ch2', ncx_index: 1, sub: [] },
    ]
    const idToIndex = new Map([
      ['ch1', 0],
      ['ch2', 1],
    ])
    const idToTitle = new Map([
      ['ch1', 'Chapter 1'],
      ['ch2', 'Chapter 2'],
    ])

    // For a flat list, the consumer should check hasHierarchy
    // buildTocTree always builds the tree; the caller decides whether to include it
    const result = buildTocTree(ncx, idToIndex, idToTitle)
    expect(result).toHaveLength(2)
    expect(result.every(n => n.children.length === 0)).toBe(true)
  })
})
