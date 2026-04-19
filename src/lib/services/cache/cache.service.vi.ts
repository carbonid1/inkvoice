import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockFs = vi.hoisted(() => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockRejectedValue(new Error('ENOENT')),
  writeFile: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
}))

const mockDiskSpace = vi.hoisted(() => ({
  getAvailableSpace: vi.fn(),
}))

const mockSettingsService = vi.hoisted(() => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('fs/promises', () => ({ default: mockFs }))
vi.mock('@/lib/services/platform/diskSpace', () => ({ diskSpaceService: mockDiskSpace }))
vi.mock('@/lib/services/settings/settings.service', () => ({
  settingsService: mockSettingsService,
}))
vi.mock('@/lib/config/env', () => ({
  env: {
    cacheDir: '/tmp/test-cache',
    maxCacheSizeBytes: 10 * 1024 * 1024 * 1024,
  },
}))

import { getCacheService, resetCacheService } from './cache.service'

describe('TTSCacheService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetCacheService()
    mockFs.readFile.mockRejectedValue(new Error('ENOENT'))
  })

  describe('disk-aware effective max', () => {
    it('clamps effective max to available disk minus 10% safety margin', async () => {
      mockDiskSpace.getAvailableSpace.mockResolvedValue({
        available: 5_000_000_000,
        total: 50_000_000_000,
        percentFree: 10,
      })

      const stats = await getCacheService().getStats()

      expect(stats.maxBytes).toBe(4_500_000_000)
    })

    it('uses configured max when disk has plenty of space', async () => {
      mockDiskSpace.getAvailableSpace.mockResolvedValue({
        available: 100_000_000_000,
        total: 500_000_000_000,
        percentFree: 20,
      })

      const stats = await getCacheService().getStats()

      expect(stats.maxBytes).toBe(10 * 1024 * 1024 * 1024)
    })

    it('falls back to configured max when disk space check fails', async () => {
      mockDiskSpace.getAvailableSpace.mockRejectedValue(new Error('EACCES'))

      const stats = await getCacheService().getStats()

      expect(stats.maxBytes).toBe(10 * 1024 * 1024 * 1024)
    })
  })

  describe('getBookStats', () => {
    it('groups entries by bookId and sums sizes', async () => {
      mockDiskSpace.getAvailableSpace.mockResolvedValue({
        available: 100_000_000_000,
        total: 500_000_000_000,
        percentFree: 20,
      })

      const service = getCacheService()
      await service.set('text 1', 'voice', Buffer.alloc(100), 'book-a')
      await service.set('text 2', 'voice', Buffer.alloc(200), 'book-a')
      await service.set('text 3', 'voice', Buffer.alloc(300), 'book-b')

      const stats = await service.getBookStats()

      const bookA = stats.find(s => s.bookId === 'book-a')
      const bookB = stats.find(s => s.bookId === 'book-b')
      expect(bookA).toEqual({ bookId: 'book-a', usedBytes: 300, entryCount: 2 })
      expect(bookB).toEqual({ bookId: 'book-b', usedBytes: 300, entryCount: 1 })
    })

    it('groups entries without bookId under "unknown"', async () => {
      mockDiskSpace.getAvailableSpace.mockResolvedValue({
        available: 100_000_000_000,
        total: 500_000_000_000,
        percentFree: 20,
      })

      const service = getCacheService()
      await service.set('orphan text', 'voice', Buffer.alloc(50))

      const stats = await service.getBookStats()

      const unknown = stats.find(s => s.bookId === 'unknown')
      expect(unknown).toEqual({ bookId: 'unknown', usedBytes: 50, entryCount: 1 })
    })
  })

  describe('deleteByBookId', () => {
    it('removes all entries for a book and returns freed bytes', async () => {
      mockDiskSpace.getAvailableSpace.mockResolvedValue({
        available: 100_000_000_000,
        total: 500_000_000_000,
        percentFree: 20,
      })

      const service = getCacheService()
      await service.set('text 1', 'voice', Buffer.alloc(100), 'book-a')
      await service.set('text 2', 'voice', Buffer.alloc(200), 'book-a')
      await service.set('text 3', 'voice', Buffer.alloc(300), 'book-b')

      const freed = await service.deleteByBookId('book-a')

      expect(freed).toBe(300)
      const stats = await service.getStats()
      expect(stats.usedBytes).toBe(300)

      const bookStats = await service.getBookStats()
      expect(bookStats.find(s => s.bookId === 'book-a')).toBeUndefined()
      expect(bookStats.find(s => s.bookId === 'book-b')).toBeDefined()
    })

    it('returns 0 when no entries exist for the book', async () => {
      mockDiskSpace.getAvailableSpace.mockResolvedValue({
        available: 100_000_000_000,
        total: 500_000_000_000,
        percentFree: 20,
      })

      const service = getCacheService()
      const freed = await service.deleteByBookId('nonexistent')

      expect(freed).toBe(0)
    })
  })

  describe('setMaxSizeMB', () => {
    it('updates effective max and persists to settings', async () => {
      mockDiskSpace.getAvailableSpace.mockResolvedValue({
        available: 100_000_000_000,
        total: 500_000_000_000,
        percentFree: 20,
      })

      const service = getCacheService()
      await service.setMaxSizeMB(5120) // 5 GB

      const stats = await service.getStats()
      expect(stats.maxBytes).toBe(5120 * 1024 * 1024)
      expect(mockSettingsService.set).toHaveBeenCalledWith('maxCacheSizeMB', 5120)
    })

    it('clamps to disk safety margin when disk is small', async () => {
      mockDiskSpace.getAvailableSpace.mockResolvedValue({
        available: 3_000_000_000, // 3 GB available
        total: 10_000_000_000,
        percentFree: 30,
      })

      const service = getCacheService()
      await service.setMaxSizeMB(5120) // requesting 5 GB, but only 2.7 GB safe

      const stats = await service.getStats()
      expect(stats.maxBytes).toBe(2_700_000_000) // 3GB * 0.9
    })
  })

  describe('no auto-eviction', () => {
    it('keeps all entries even when writes exceed effective max', async () => {
      mockDiskSpace.getAvailableSpace.mockResolvedValue({
        available: 200,
        total: 1000,
        percentFree: 20,
      })
      // effective max = min(10GB, 200 * 0.9) = 180 bytes

      const service = getCacheService()

      await service.set('text 1', 'voice', Buffer.alloc(80), 'book-a')
      await service.set('text 2', 'voice', Buffer.alloc(80), 'book-b')
      // This write would push usage to 240, over the 180 ceiling — but we no
      // longer evict, so the entry must persist.
      await service.set('text 3', 'voice', Buffer.alloc(80), 'book-c')

      const unlinkCalls = mockFs.unlink.mock.calls.map(([p]: [string]) => p)
      expect(unlinkCalls.filter((p: string) => p.endsWith('.opus'))).toEqual([])

      const stats = await service.getStats()
      expect(stats.usedBytes).toBe(240)
      const bookStats = await service.getBookStats()
      expect(bookStats.map(s => s.bookId).sort()).toEqual(['book-a', 'book-b', 'book-c'])
    })
  })
})
