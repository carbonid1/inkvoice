import { describe, expect, it } from 'vitest'
import { normalizeTitle } from './normalizeTitle'

describe('normalizeTitle', () => {
  it('converts all-caps to title case', () => {
    expect(normalizeTitle('CHAPTER ONE')).toBe('Chapter One')
  })

  it('converts single all-caps word', () => {
    expect(normalizeTitle('ACKNOWLEDGEMENTS')).toBe('Acknowledgements')
  })

  it('leaves mixed-case unchanged', () => {
    expect(normalizeTitle('Book Two')).toBe('Book Two')
  })

  it('leaves already title-cased unchanged', () => {
    expect(normalizeTitle('Prologue')).toBe('Prologue')
  })

  it('preserves hyphens in all-caps titles', () => {
    expect(normalizeTitle('CHAPTER TWENTY-ONE')).toBe('Chapter Twenty-One')
  })

  it('leaves sentence-case unchanged', () => {
    expect(normalizeTitle("Acclaim for Steven Author's large epub")).toBe(
      "Acclaim for Steven Author's large epub",
    )
  })

  it('strips trailing colon', () => {
    expect(normalizeTitle('Appendix:')).toBe('Appendix')
  })

  it('preserves colons mid-string', () => {
    expect(normalizeTitle('Book One: The Whirlwind')).toBe('Book One: The Whirlwind')
  })

  it('strips trailing colon after all-caps normalization', () => {
    expect(normalizeTitle('EPILOGUE:')).toBe('Epilogue')
  })
})
