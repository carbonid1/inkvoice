import { describe, expect, it } from 'vitest'
import { isSpeakableText } from './isSpeakableText'

describe('isSpeakableText', () => {
  it('accepts prose', () => {
    expect(isSpeakableText('Glad I could be a part of it.')).toBe(true)
  })

  it('accepts bare numbers', () => {
    expect(isSpeakableText('42')).toBe(true)
  })

  it('accepts non-Latin scripts', () => {
    expect(isSpeakableText('Тіні забутих предків')).toBe(true)
  })

  it('rejects dash rules', () => {
    expect(isSpeakableText('———')).toBe(false)
  })

  it('rejects asterisms', () => {
    expect(isSpeakableText('* * *')).toBe(false)
  })

  it('rejects punctuation-only headlines', () => {
    expect(isSpeakableText('???')).toBe(false)
  })

  it('rejects whitespace and empty strings', () => {
    expect(isSpeakableText('   ')).toBe(false)
    expect(isSpeakableText('')).toBe(false)
  })
})
