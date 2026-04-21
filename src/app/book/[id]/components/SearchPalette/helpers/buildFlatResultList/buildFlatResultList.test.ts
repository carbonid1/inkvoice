import type { SearchMatch } from '@/app/book/[id]/hooks/useBookSearch/useBookSearch.types'
import { describe, expect, it } from 'vitest'
import { buildFlatResultList } from './buildFlatResultList'

const match = (overrides: Partial<SearchMatch> = {}): SearchMatch => ({
  chapter: 0,
  paragraph: 0,
  chapterTitle: 'Chapter 1',
  textSnippet: 'some text',
  matchPositions: [0],
  ...overrides,
})

describe('buildFlatResultList', () => {
  it('returns empty array for empty results', () => {
    expect(buildFlatResultList([])).toEqual([])
  })

  it('groups consecutive matches under same chapter', () => {
    const results = [
      match({ chapter: 0, paragraph: 0, chapterTitle: 'Chapter 1' }),
      match({ chapter: 0, paragraph: 3, chapterTitle: 'Chapter 1' }),
    ]

    const flat = buildFlatResultList(results)

    expect(flat).toEqual([
      { type: 'header', chapterTitle: 'Chapter 1', matchCount: 2 },
      { type: 'result', match: results[0], resultIndex: 0 },
      { type: 'result', match: results[1], resultIndex: 1 },
    ])
  })

  it('inserts header for each chapter with correct match count', () => {
    const results = [
      match({ chapter: 0, chapterTitle: 'Prologue' }),
      match({ chapter: 1, chapterTitle: 'Chapter 1' }),
      match({ chapter: 1, chapterTitle: 'Chapter 1' }),
      match({ chapter: 1, chapterTitle: 'Chapter 1' }),
    ]

    const flat = buildFlatResultList(results)
    const headers = flat.filter(e => e.type === 'header')

    expect(headers).toEqual([
      { type: 'header', chapterTitle: 'Prologue', matchCount: 1 },
      { type: 'header', chapterTitle: 'Chapter 1', matchCount: 3 },
    ])
  })

  it('maps resultIndex to original results array position', () => {
    const results = [
      match({ chapter: 0, chapterTitle: 'A' }),
      match({ chapter: 1, chapterTitle: 'B' }),
      match({ chapter: 2, chapterTitle: 'C' }),
    ]

    const flat = buildFlatResultList(results)
    const resultIndexes = flat.flatMap(e => (e.type === 'result' ? [e.resultIndex] : []))

    expect(resultIndexes).toEqual([0, 1, 2])
  })

  it('single chapter produces one header plus result items', () => {
    const results = [match({ chapter: 5, chapterTitle: 'Epilogue' })]
    const flat = buildFlatResultList(results)

    expect(flat).toHaveLength(2)
    expect(flat[0]).toEqual({ type: 'header', chapterTitle: 'Epilogue', matchCount: 1 })
    expect(flat[1]).toMatchObject({ type: 'result', resultIndex: 0 })
  })

  it('omits headers when showHeaders is false', () => {
    const results = [
      match({ chapter: 0, paragraph: 0, chapterTitle: 'Prologue' }),
      match({ chapter: 1, paragraph: 2, chapterTitle: 'Chapter 1' }),
      match({ chapter: 1, paragraph: 5, chapterTitle: 'Chapter 1' }),
    ]

    const flat = buildFlatResultList(results, { showHeaders: false })

    expect(flat.every(e => e.type === 'result')).toBe(true)
    expect(flat).toHaveLength(3)
    const resultIndexes = flat.flatMap(e => (e.type === 'result' ? [e.resultIndex] : []))
    expect(resultIndexes).toEqual([0, 1, 2])
  })
})
