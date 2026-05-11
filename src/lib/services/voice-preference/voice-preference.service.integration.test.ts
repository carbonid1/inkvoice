import { describe, expect, it } from 'vitest'
import { voicePreferenceService } from './voice-preference.service'

describe('voicePreferenceService (integration)', () => {
  it('returns the default voice when no rows exist', async () => {
    const result = await voicePreferenceService.getAll()

    expect(result).toEqual({ voice: 'clara', bookVoices: {} })
  })

  it('splits __global__ row into top-level voice; per-book rows go into bookVoices', async () => {
    await voicePreferenceService.set('__global__', 'narrator')
    await voicePreferenceService.set('book-1', 'emma')
    await voicePreferenceService.set('book-2', 'james')

    const result = await voicePreferenceService.getAll()

    expect(result).toEqual({
      voice: 'narrator',
      bookVoices: { 'book-1': 'emma', 'book-2': 'james' },
    })
  })

  it('set overrides the existing voice for the same bookId', async () => {
    await voicePreferenceService.set('book-1', 'emma')
    await voicePreferenceService.set('book-1', 'james')

    const { bookVoices } = await voicePreferenceService.getAll()

    expect(bookVoices).toEqual({ 'book-1': 'james' })
  })

  it('returns false when removing a preference that does not exist', async () => {
    expect(await voicePreferenceService.remove('unknown')).toBe(false)
  })

  it('removeByVoiceName deletes every row using that voice and returns the count', async () => {
    await voicePreferenceService.set('book-1', 'emma')
    await voicePreferenceService.set('book-2', 'emma')
    await voicePreferenceService.set('book-3', 'james')

    const removed = await voicePreferenceService.removeByVoiceName('emma')

    expect(removed).toBe(2)
    const { bookVoices } = await voicePreferenceService.getAll()

    expect(bookVoices).toEqual({ 'book-3': 'james' })
  })
})
