import { describe, expect, it, vi } from 'vitest'

const mockPrisma = vi.hoisted(() => ({
  userSetting: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    upsert: vi.fn().mockResolvedValue({}),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  },
}))

vi.mock('../db/db.service', () => ({
  prisma: mockPrisma,
}))

import { settingsService } from './settings.service'

describe('settingsService', () => {
  it('returns empty record when no settings exist', async () => {
    mockPrisma.userSetting.findMany.mockResolvedValue([])
    const result = await settingsService.getAll()
    expect(result).toEqual({})
  })

  it('returns JSON-parsed values keyed by setting name', async () => {
    mockPrisma.userSetting.findMany.mockResolvedValue([
      { key: 'display.fontSize', value: '"large"' },
      { key: 'prefetch.enabled', value: 'false' },
    ])
    const result = await settingsService.getAll()
    expect(result).toEqual({
      'display.fontSize': 'large',
      'prefetch.enabled': false,
    })
  })

  it('returns parsed value for known key', async () => {
    mockPrisma.userSetting.findUnique.mockResolvedValue({
      key: 'display.fontSize',
      value: '"medium"',
    })
    const result = await settingsService.get('display.fontSize')
    expect(result).toBe('medium')
  })

  it('returns null for unknown key', async () => {
    mockPrisma.userSetting.findUnique.mockResolvedValue(null)
    const result = await settingsService.get('unknown.key')
    expect(result).toBeNull()
  })

  it('upserts with JSON-stringified value', async () => {
    await settingsService.set('prefetch.enabled', true)
    expect(mockPrisma.userSetting.upsert).toHaveBeenCalledWith({
      where: { key: 'prefetch.enabled' },
      create: { key: 'prefetch.enabled', value: 'true' },
      update: { value: 'true' },
    })
  })

  it('removes setting and returns true when found', async () => {
    mockPrisma.userSetting.deleteMany.mockResolvedValue({ count: 1 })
    const result = await settingsService.remove('display.fontSize')
    expect(result).toBe(true)
  })

  it('returns false when removing non-existent setting', async () => {
    mockPrisma.userSetting.deleteMany.mockResolvedValue({ count: 0 })
    const result = await settingsService.remove('unknown')
    expect(result).toBe(false)
  })
})
