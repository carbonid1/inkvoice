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
    expect(inferChapterTitle({ ...base, htmlHeading: 'The Whirlwind' })).toBe('The Whirlwind')
  })

  it('uses TOC label when no heading', () => {
    expect(inferChapterTitle({ ...base, tocLabel: 'Dramatis Personae' })).toBe('Dramatis Personae')
  })

  it('uses spine title when no heading or TOC label', () => {
    expect(inferChapterTitle({ ...base, itemTitle: 'Prologue' })).toBe('Prologue')
  })

  it('returns "Illustrations" for image-only chapters', () => {
    expect(inferChapterTitle({ ...base, isImageOnly: true })).toBe('Illustrations')
  })

  it('extracts label from file ID keyword', () => {
    expect(inferChapterTitle({ ...base, itemId: 'CopyrightPage' })).toBe('Copyright')
  })

  it('falls back to "Chapter" for unknown file IDs', () => {
    expect(inferChapterTitle({ ...base, itemId: 'xhtml-42' })).toBe('Chapter')
  })

  it('heading beats TOC label', () => {
    expect(inferChapterTitle({ ...base, htmlHeading: 'Heading', tocLabel: 'TOC Label' })).toBe(
      'Heading',
    )
  })

  it('TOC label beats spine title', () => {
    expect(inferChapterTitle({ ...base, tocLabel: 'TOC Label', itemTitle: 'Spine Title' })).toBe(
      'TOC Label',
    )
  })

  it('spine title beats image-only', () => {
    expect(inferChapterTitle({ ...base, itemTitle: 'Maps', isImageOnly: true })).toBe('Maps')
  })

  it('file ID beats image-only fallback', () => {
    expect(inferChapterTitle({ ...base, itemId: 'cover', isImageOnly: true })).toBe('Cover')
  })

  it('file ID beats Chapter N fallback', () => {
    expect(inferChapterTitle({ ...base, itemId: 'dedication.xhtml' })).toBe('Dedication')
  })

  describe('ALL CAPS normalization', () => {
    it('converts all-caps heading to title case', () => {
      expect(inferChapterTitle({ ...base, htmlHeading: 'CHAPTER ONE' })).toBe('Chapter One')
    })

    it('converts single all-caps word', () => {
      expect(inferChapterTitle({ ...base, htmlHeading: 'ACKNOWLEDGEMENTS' })).toBe(
        'Acknowledgements',
      )
    })

    it('leaves mixed-case heading unchanged', () => {
      expect(inferChapterTitle({ ...base, htmlHeading: 'Book Two' })).toBe('Book Two')
    })

    it('leaves already-title-case unchanged', () => {
      expect(inferChapterTitle({ ...base, itemTitle: 'Prologue' })).toBe('Prologue')
    })

    it('preserves hyphens in all-caps titles', () => {
      expect(inferChapterTitle({ ...base, tocLabel: 'CHAPTER TWENTY-ONE' })).toBe(
        'Chapter Twenty-One',
      )
    })

    it('leaves mixed-case sentence unchanged', () => {
      expect(
        inferChapterTitle(
          { ...base, htmlHeading: "Acclaim for Steven Author's large epub" },
          1,
        ),
      ).toBe("Acclaim for Steven Author's large epub")
    })

    it('normalizes all-caps TOC label', () => {
      expect(inferChapterTitle({ ...base, tocLabel: 'EPILOGUE' })).toBe('Epilogue')
    })
  })

  describe('trailing colon stripping', () => {
    it('strips trailing colon from heading', () => {
      expect(
        inferChapterTitle(
          { ...base, htmlHeading: 'Acclaim for The Series Book of the Fallen:' },
          1,
        ),
      ).toBe('Acclaim for The Series Book of the Fallen')
    })

    it('strips trailing colon from TOC label', () => {
      expect(inferChapterTitle({ ...base, tocLabel: 'Appendix:' })).toBe('Appendix')
    })

    it('preserves colons mid-string', () => {
      expect(inferChapterTitle({ ...base, htmlHeading: 'Book One: The Whirlwind' })).toBe(
        'Book One: The Whirlwind',
      )
    })
  })
})
