import { describe, expect, it } from 'vitest'
import { pregenQueueService } from './pregenQueue.service'

const MISSING_ID = '00000000-0000-0000-0000-000000000000'

describe('pregenQueueService (integration) — P2025 race policy', () => {
  it('start() returns null when the job row does not exist', async () => {
    const result = await pregenQueueService.start(MISSING_ID)

    expect(result).toBeNull()
  })

  it('updateProgress() returns null when the job row does not exist', async () => {
    const result = await pregenQueueService.updateProgress(MISSING_ID, 0, 0, 0)

    expect(result).toBeNull()
  })

  it('pause() returns null when the job row does not exist', async () => {
    const result = await pregenQueueService.pause(MISSING_ID)

    expect(result).toBeNull()
  })

  it('resume() returns null when the job row does not exist', async () => {
    const result = await pregenQueueService.resume(MISSING_ID)

    expect(result).toBeNull()
  })

  it('complete() returns null when the job row does not exist', async () => {
    const result = await pregenQueueService.complete(MISSING_ID)

    expect(result).toBeNull()
  })

  it('cancel() reports deleted: false when the row does not exist', async () => {
    const result = await pregenQueueService.cancel(MISSING_ID)

    expect(result).toEqual({ deleted: false })
  })

  it('cancel() reports deleted: true when the row exists', async () => {
    const job = await pregenQueueService.enqueue('book-1', 'narrator', 100)

    const result = await pregenQueueService.cancel(job.id)

    expect(result).toEqual({ deleted: true })
  })
})
