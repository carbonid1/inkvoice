const HEARTBEAT_INTERVAL_MS = 30_000

export type SSEEnqueue = {
  event: (event: string, data: unknown) => void
  data: (data: unknown) => void
}

export type SSESetup = (enqueue: SSEEnqueue) => void | Promise<void> | (() => void) | Promise<() => void>

export const makeSSEResponse = (setup: SSESetup): Response => {
  const encoder = new TextEncoder()
  let cleanup: (() => void) | undefined
  let heartbeat: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue: SSEEnqueue = {
        event: (event, data) => {
          try {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
          } catch {
            // closed
          }
        },
        data: data => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
          } catch {
            // closed
          }
        },
      }

      const result = await setup(enqueue)
      if (typeof result === 'function') cleanup = result

      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'))
        } catch {
          // closed
        }
      }, HEARTBEAT_INTERVAL_MS)
    },
    cancel() {
      cleanup?.()
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
