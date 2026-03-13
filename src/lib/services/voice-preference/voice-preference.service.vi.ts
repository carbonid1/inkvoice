import { describe, expect, it, vi } from 'vitest'

const mockPrisma = vi.hoisted(() => ({
  voicePreference: {
    findMany: vi.fn().mockResolvedValue([]),
    upsert: vi.fn().mockResolvedValue({}),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  },
}))

vi.mock('../db/db.service', () => ({
  prisma: mockPrisma,
}))

import { voicePreferenceService } from './voice-preference.service'

describe('voicePreferenceService', () => {
  it('returns default voice and empty bookVoices when no rows exist', async () => {
    mockPrisma.voicePreference.findMany.mockResolvedValue([])
    const result = await voicePreferenceService.getAll()
    expect(result).toEqual({ voice: 'clara', bookVoices: {} })
  })

  it('returns global voice and per-book overrides from rows', async () => {
    mockPrisma.voicePreference.findMany.mockResolvedValue([
      { bookId: '__global__', voiceName: 'narrator' },
      { bookId: 'book-1', voiceName: 'emma' },
      { bookId: 'book-2', voiceName: 'james' },
    ])

    const result = await voicePreferenceService.getAll()
    expect(result).toEqual({
      voice: 'narrator',
      bookVoices: { 'book-1': 'emma', 'book-2': 'james' },
    })
  })

  it('upserts a voice preference row', async () => {
    await voicePreferenceService.set('book-1', 'emma')
    expect(mockPrisma.voicePreference.upsert).toHaveBeenCalledWith({
      where: { bookId: 'book-1' },
      create: { bookId: 'book-1', voiceName: 'emma' },
      update: { voiceName: 'emma' },
    })
  })

  it('removes a preference and returns true when found', async () => {
    mockPrisma.voicePreference.deleteMany.mockResolvedValue({ count: 1 })
    const result = await voicePreferenceService.remove('book-1')
    expect(result).toBe(true)
    expect(mockPrisma.voicePreference.deleteMany).toHaveBeenCalledWith({
      where: { bookId: 'book-1' },
    })
  })

  it('returns false when removing non-existent preference', async () => {
    mockPrisma.voicePreference.deleteMany.mockResolvedValue({ count: 0 })
    const result = await voicePreferenceService.remove('unknown')
    expect(result).toBe(false)
  })

  it('deletes all rows matching a voice name and returns count', async () => {
    mockPrisma.voicePreference.deleteMany.mockResolvedValue({ count: 3 })
    const result = await voicePreferenceService.removeByVoiceName('emma')
    expect(result).toBe(3)
    expect(mockPrisma.voicePreference.deleteMany).toHaveBeenCalledWith({
      where: { voiceName: 'emma' },
    })
  })
})
