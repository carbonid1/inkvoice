import { describe, expect, it } from 'vitest'
import { validateVoiceName } from './validateVoiceName'

describe('validateVoiceName', () => {
  it('accepts lowercase alphanumeric with hyphens', () => {
    expect(validateVoiceName('my-voice-2')).toBeNull()
  })

  it('rejects empty string', () => {
    expect(validateVoiceName('')).toBe('Voice name is required')
  })

  it('rejects path traversal with dots', () => {
    expect(validateVoiceName('../evil')).toBe('Voice name contains invalid characters')
  })

  it('rejects slashes', () => {
    expect(validateVoiceName('foo/bar')).toBe('Voice name contains invalid characters')
  })

  it('rejects names longer than 50 characters', () => {
    const long = 'a'.repeat(51)

    expect(validateVoiceName(long)).toBe('Voice name must be 50 characters or less')
  })

  it('rejects names with uppercase characters', () => {
    expect(validateVoiceName('MyVoice')).toBe('Voice name contains invalid characters')
  })

  it('rejects names with spaces', () => {
    expect(validateVoiceName('my voice')).toBe('Voice name contains invalid characters')
  })

  it('rejects collision with existing voice names', () => {
    expect(validateVoiceName('narrator', ['narrator', 'casual'])).toBe(
      'A voice named "narrator" already exists',
    )
  })

  it('accepts names not in existing list', () => {
    expect(validateVoiceName('my-voice', ['narrator', 'casual'])).toBeNull()
  })

  it('accepts exactly 50 characters', () => {
    expect(validateVoiceName('a'.repeat(50))).toBeNull()
  })
})
