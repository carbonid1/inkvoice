import { makeSSEResponse } from '@/lib/helpers/sseResponse/sseResponse'
import { pregenEvents } from '@/lib/services/pregenEvents/pregenEvents.service'
import type {
  PregenEvent,
  PregenEventListener,
} from '@/lib/services/pregenEvents/pregenEvents.types'
import { pregenQueueService } from '@/lib/services/pregenQueue/pregenQueue.service'
// Side-effect import: triggers worker auto-recovery on module evaluation
import '@/lib/services/pregeneration/pregeneration.service'

export const dynamic = 'force-dynamic'

export const GET = async () => {
  return makeSSEResponse(async enqueue => {
    const jobs = await pregenQueueService.getAll()
    enqueue.event('snapshot', jobs)

    const warmingUpBookId = pregenEvents.getWarmingUpBookId()
    if (warmingUpBookId) {
      enqueue.event('warmup_start', { type: 'warmup_start', bookId: warmingUpBookId })
    }

    const listener: PregenEventListener = (event: PregenEvent) => {
      enqueue.event(event.type, event)
    }
    pregenEvents.on(listener)
    return () => pregenEvents.off(listener)
  })
}
