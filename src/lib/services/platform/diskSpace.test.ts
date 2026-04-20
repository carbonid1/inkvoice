import { describe, expect, it, vi } from 'vitest'

import type { DiskSpaceInfo } from './diskSpace.types'

const mockStatfs = vi.hoisted(() => vi.fn())
vi.mock('fs/promises', () => ({ default: { statfs: mockStatfs } }))

import { diskSpaceService } from './diskSpace'

describe('diskSpaceService', () => {
  describe('getAvailableSpace', () => {
    it('returns normalized disk space info', async () => {
      mockStatfs.mockResolvedValue({
        bavail: 12207031,
        bsize: 4096,
        blocks: 122070312,
      })

      const result = await diskSpaceService.getAvailableSpace('/tmp')

      expect(result).toEqual<DiskSpaceInfo>({
        available: 12207031 * 4096,
        total: 122070312 * 4096,
        percentFree: 10,
      })
      expect(mockStatfs).toHaveBeenCalledWith('/tmp')
    })

    it('rounds percentFree to 2 decimal places', async () => {
      mockStatfs.mockResolvedValue({
        bavail: 1,
        bsize: 1,
        blocks: 3,
      })

      const result = await diskSpaceService.getAvailableSpace('/tmp')

      expect(result.percentFree).toBe(33.33)
    })

    it('returns zero percentFree when total size is zero', async () => {
      mockStatfs.mockResolvedValue({
        bavail: 0,
        bsize: 0,
        blocks: 0,
      })

      const result = await diskSpaceService.getAvailableSpace('/tmp')

      expect(result).toEqual<DiskSpaceInfo>({
        available: 0,
        total: 0,
        percentFree: 0,
      })
    })

    it('propagates errors from the underlying disk check', async () => {
      mockStatfs.mockRejectedValue(new Error('ENOENT: no such directory'))

      await expect(diskSpaceService.getAvailableSpace('/nonexistent')).rejects.toThrow(
        'ENOENT: no such directory',
      )
    })
  })
})
