import { getCacheService } from '@/lib/services/cache/cache.service'
import { pregenEvents } from '@/lib/services/pregenEvents/pregenEvents.service'
import { pregenQueueService } from '@/lib/services/pregenQueue/pregenQueue.service'
import { signalStop } from '@/lib/services/pregeneration/pregeneration.service'
import { NextRequest, NextResponse } from 'next/server'

type RouteParams = { params: Promise<{ bookId: string }> }

export const DELETE = async (_request: NextRequest, { params }: RouteParams) => {
  const { bookId } = await params

  try {
    const cacheService = getCacheService()
    const freedBytes = await cacheService.deleteByBookId(bookId)

    // Pregen progress is a derived view of cache coverage — if the cache is
    // gone, the job record must go with it or the ring lies to the user.
    const job = await pregenQueueService.getAnyByBookId(bookId)
    if (job) {
      signalStop(job.id)
      const { deleted } = await pregenQueueService.cancel(job.id)
      if (deleted) pregenEvents.emit({ type: 'deleted', bookId })
    }

    return NextResponse.json({ freedBytes })
  } catch (error) {
    console.error('Failed to delete book cache:', error)
    return NextResponse.json({ error: 'Failed to delete book cache' }, { status: 500 })
  }
}
