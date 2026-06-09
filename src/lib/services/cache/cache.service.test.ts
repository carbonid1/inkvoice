import { beforeEach, describe, expect, it, vi } from 'vitest'

interface CacheRow {
  hash: string
  bookId: string | null
  voice: string
  sizeBytes: number
  durationMs: number | null
  createdAt: number
}

interface WhereMatcher {
  hash?: string | { in: string[] }
  bookId?: string | { not: null }
  voice?: string
}

const matchesWhere = (row: CacheRow, where: WhereMatcher | undefined): boolean => {
  if (!where) return true
  if (typeof where.hash === 'string' && row.hash !== where.hash) return false
  if (where.hash && typeof where.hash === 'object' && !where.hash.in.includes(row.hash))
    return false
  if (typeof where.bookId === 'string' && row.bookId !== where.bookId) return false
  if (where.bookId && typeof where.bookId === 'object' && row.bookId === null) return false
  if (where.voice !== undefined && row.voice !== where.voice) return false
  return true
}

/* eslint-disable require-await */
const mockPrisma = vi.hoisted(() => {
  const rows = new Map<string, CacheRow>()

  return {
    __rows: rows,
    cacheEntry: {
      count: vi.fn(async (args?: { where?: WhereMatcher }) => {
        if (!args?.where) return rows.size
        return [...rows.values()].filter(r => matchesWhere(r, args.where)).length
      }),
      findUnique: vi.fn(async (args: { where: { hash: string } }) => {
        return rows.get(args.where.hash) ?? null
      }),
      findMany: vi.fn(async (args?: { where?: WhereMatcher }) => {
        return [...rows.values()].filter(r => matchesWhere(r, args?.where))
      }),
      upsert: vi.fn(
        async (args: { where: { hash: string }; create: CacheRow; update: Partial<CacheRow> }) => {
          const existing = rows.get(args.where.hash)

          if (existing) {
            const merged = { ...existing, ...args.update }

            rows.set(args.where.hash, merged)
            return merged
          }
          rows.set(args.where.hash, args.create)
          return args.create
        },
      ),
      delete: vi.fn(async (args: { where: { hash: string } }) => {
        const existing = rows.get(args.where.hash)

        if (!existing) throw new Error('Record not found')
        rows.delete(args.where.hash)
        return existing
      }),
      deleteMany: vi.fn(async (args?: { where?: WhereMatcher }) => {
        let count = 0

        for (const row of [...rows.values()]) {
          if (matchesWhere(row, args?.where)) {
            rows.delete(row.hash)
            count++
          }
        }
        return { count }
      }),
      aggregate: vi.fn(async () => {
        const sum = [...rows.values()].reduce((acc, r) => acc + r.sizeBytes, 0)

        return { _sum: { sizeBytes: rows.size === 0 ? null : sum } }
      }),
      groupBy: vi.fn(async (args: { by: ('bookId' | 'voice')[]; where?: WhereMatcher }) => {
        const filtered = [...rows.values()].filter(r => matchesWhere(r, args.where))
        const groups = new Map<
          string,
          { bookId: string | null; voice: string; sum: number; count: number }
        >()

        for (const row of filtered) {
          const key = `${row.bookId ?? '__null__'}|${row.voice}`
          const group = groups.get(key) ?? {
            bookId: row.bookId,
            voice: row.voice,
            sum: 0,
            count: 0,
          }

          group.sum += row.sizeBytes
          group.count++
          groups.set(key, group)
        }
        return [...groups.values()].map(g => ({
          bookId: g.bookId,
          voice: g.voice,
          _sum: { sizeBytes: g.sum },
          _count: { _all: g.count },
        }))
      }),
    },
  }
})
/* eslint-enable require-await */

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
vi.mock('@/lib/services/db/db.service', () => ({ prisma: mockPrisma }))
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
    mockPrisma.__rows.clear()
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
    it('groups entries by (bookId, voice) and sums sizes', async () => {
      mockDiskSpace.getAvailableSpace.mockResolvedValue({
        available: 100_000_000_000,
        total: 500_000_000_000,
        percentFree: 20,
      })

      const service = getCacheService()

      await service.set('text 1', 'clara', Buffer.alloc(100), 'book-a')
      await service.set('text 2', 'clara', Buffer.alloc(200), 'book-a')
      await service.set('text 3', 'jonathan', Buffer.alloc(150), 'book-a')
      await service.set('text 4', 'clara', Buffer.alloc(300), 'book-b')

      const stats = await service.getBookStats()

      expect(stats).toContainEqual({
        bookId: 'book-a',
        voice: 'clara',
        usedBytes: 300,
        entryCount: 2,
      })
      expect(stats).toContainEqual({
        bookId: 'book-a',
        voice: 'jonathan',
        usedBytes: 150,
        entryCount: 1,
      })
      expect(stats).toContainEqual({
        bookId: 'book-b',
        voice: 'clara',
        usedBytes: 300,
        entryCount: 1,
      })
    })

    it('groups entries without bookId under "unknown"', async () => {
      mockDiskSpace.getAvailableSpace.mockResolvedValue({
        available: 100_000_000_000,
        total: 500_000_000_000,
        percentFree: 20,
      })

      const service = getCacheService()

      await service.set('orphan text', 'clara', Buffer.alloc(50))

      const stats = await service.getBookStats()

      const unknown = stats.find(s => s.bookId === 'unknown')

      expect(unknown).toEqual({
        bookId: 'unknown',
        voice: 'clara',
        usedBytes: 50,
        entryCount: 1,
      })
    })
  })

  describe('hasMany', () => {
    it('reports cache presence per text in input order', async () => {
      mockDiskSpace.getAvailableSpace.mockResolvedValue({
        available: 100_000_000_000,
        total: 500_000_000_000,
        percentFree: 20,
      })

      const service = getCacheService()

      await service.set('cached one', 'clara', Buffer.alloc(10), 'book-a')
      await service.set('cached two', 'clara', Buffer.alloc(10), 'book-a')

      const result = await service.hasMany(['cached one', 'never generated', 'cached two'], 'clara')

      expect(result).toEqual([true, false, true])
    })

    it('does not match entries cached under a different voice', async () => {
      mockDiskSpace.getAvailableSpace.mockResolvedValue({
        available: 100_000_000_000,
        total: 500_000_000_000,
        percentFree: 20,
      })

      const service = getCacheService()

      await service.set('some text', 'clara', Buffer.alloc(10), 'book-a')

      expect(await service.hasMany(['some text'], 'jonathan')).toEqual([false])
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

      const unlinkCalls = mockFs.unlink.mock.calls.map(args => args[0])

      expect(unlinkCalls.filter(p => p.endsWith('.opus'))).toEqual([])

      const stats = await service.getStats()

      expect(stats.usedBytes).toBe(240)
      const bookStats = await service.getBookStats()

      expect(bookStats.map(s => s.bookId).sort()).toEqual(['book-a', 'book-b', 'book-c'])
      expect(bookStats.every(s => s.voice === 'voice')).toBe(true)
    })
  })
})
