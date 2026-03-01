import { describe, expect, it } from 'vitest'
import { slugifyVoiceName } from './slugifyVoiceName'

describe('slugifyVoiceName', () => {
  it('converts spaces to hyphens', () => {
    expect(slugifyVoiceName('My Custom Voice')).toBe('my-custom-voice')
  })

  it('lowercases all characters', () => {
    expect(slugifyVoiceName('LOUD VOICE')).toBe('loud-voice')
  })

  it('strips special characters', () => {
    expect(slugifyVoiceName("Dan's Voice! (v2)")).toBe('dans-voice-v2')
  })

  it('collapses consecutive hyphens', () => {
    expect(slugifyVoiceName('some -- weird --- name')).toBe('some-weird-name')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugifyVoiceName(' -hello- ')).toBe('hello')
  })

  it('handles already-slugified input', () => {
    expect(slugifyVoiceName('already-a-slug')).toBe('already-a-slug')
  })

  it('handles underscores by converting to hyphens', () => {
    expect(slugifyVoiceName('british_male_surrey')).toBe('british-male-surrey')
  })
})
