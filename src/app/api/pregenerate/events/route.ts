import { pregenEvents } from '@/lib/services/pregenEvents/pregenEvents.service'
import type {
  PregenEvent,
  PregenEventListener,
} from '@/lib/services/pregenEvents/pregenEvents.types'
import { pregenQueueService } from '@/lib/services/pregenQueue/pregenQueue.service'
// Side-effect import: triggers worker auto-recovery on module evaluation
import '@/lib/services/pregeneration/pregeneration.service'

export const dynamic = 'force-dynamic'

const HEARTBEAT_INTERVAL_MS = 30_000

export const GET = async () => {
  const encoder = new TextEncoder()
  let listener: PregenEventListener | null = null
  let heartbeat: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream({
    async start(controller) {
      const jobs = await pregenQueueService.getAll()
      controller.enqueue(encoder.encode(`event: snapshot\ndata: ${JSON.stringify(jobs)}\n\n`))

      listener = (event: PregenEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`),
          )
        } catch {
          // Stream closed
        }
      }

      pregenEvents.on(listener)

      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'))
        } catch {
          // Stream closed
        }
      }, HEARTBEAT_INTERVAL_MS)
    },
    cancel() {
      if (listener) pregenEvents.off(listener)
      if (heartbeat) clearInterval(heartbeat)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
