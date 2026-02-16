import { describe, expect, it } from 'vitest'
import { inferChapterTitle } from './inferChapterTitle'

const base = {
  itemId: 'chapter1',
  tocLabel: undefined,
  itemTitle: undefined,
  htmlHeading: undefined,
  isImageOnly: false,
}

describe('inferChapterTitle', () => {
  it('uses HTML heading when present', () => {
    expect(inferChapterTitle({ ...base, htmlHeading: 'The Whirlwind' }, 1)).toBe('The Whirlwind')
  })

  it('uses TOC label when no heading', () => {
    expect(inferChapterTitle({ ...base, tocLabel: 'Dramatis Personae' }, 1)).toBe(
      'Dramatis Personae',
    )
  })

  it('uses spine title when no heading or TOC label', () => {
    expect(inferChapterTitle({ ...base, itemTitle: 'Prologue' }, 1)).toBe('Prologue')
  })

  it('returns "Illustrations" for image-only chapters', () => {
    expect(inferChapterTitle({ ...base, isImageOnly: true }, 1)).toBe('Illustrations')
  })

  it('extracts label from file ID keyword', () => {
    expect(inferChapterTitle({ ...base, itemId: 'CopyrightPage' }, 1)).toBe('Copyright')
  })

  it('falls back to "Chapter N" for unknown file IDs', () => {
    expect(inferChapterTitle({ ...base, itemId: 'xhtml-42' }, 5)).toBe('Chapter 5')
  })

  it('heading beats TOC label', () => {
    expect(
      inferChapterTitle({ ...base, htmlHeading: 'Heading', tocLabel: 'TOC Label' }, 1),
    ).toBe('Heading')
  })

  it('TOC label beats spine title', () => {
    expect(
      inferChapterTitle({ ...base, tocLabel: 'TOC Label', itemTitle: 'Spine Title' }, 1),
    ).toBe('TOC Label')
  })

  it('spine title beats image-only', () => {
    expect(
      inferChapterTitle({ ...base, itemTitle: 'Maps', isImageOnly: true }, 1),
    ).toBe('Maps')
  })

  it('image-only beats file ID', () => {
    expect(
      inferChapterTitle({ ...base, itemId: 'cover', isImageOnly: true }, 1),
    ).toBe('Illustrations')
  })

  it('file ID beats Chapter N fallback', () => {
    expect(inferChapterTitle({ ...base, itemId: 'dedication.xhtml' }, 3)).toBe('Dedication')
  })
})
