import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockPrisma = vi.hoisted(() => ({
  pregenJob: {
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../db/db.service', () => ({ prisma: mockPrisma }))

import { pregenQueueService } from './pregenQueue.service'

describe('pregenQueueService — non-P2025 error discrimination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('start() rethrows non-P2025 Prisma errors', async () => {
    mockPrisma.pregenJob.update.mockRejectedValue(new Error('database is locked'))

    await expect(pregenQueueService.start('job-1')).rejects.toThrow('database is locked')
  })

  it('cancel() rethrows non-P2025 errors', async () => {
    mockPrisma.pregenJob.delete.mockRejectedValue(new Error('database is locked'))

    await expect(pregenQueueService.cancel('job-1')).rejects.toThrow('database is locked')
  })
})
