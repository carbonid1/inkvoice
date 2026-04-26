import { makeSSEResponse } from '@/lib/helpers/sseResponse/sseResponse'

export const dynamic = 'force-dynamic'

const controlUrl = (): string | null => process.env.INKVOICE_PYTHON_CONTROL_URL ?? null

export const GET = async () => {
  const url = controlUrl()

  if (!url) {
    // Dev mode: Python is always-on, so the pill should stay hidden.
    // Emit a single 'stopped' snapshot so the hook treats this as no-chrome.
    return makeSSEResponse(enqueue => {
      enqueue.data({ state: 'stopped', instanceId: 0 })
    })
  }

  // Production: proxy the control server SSE directly
  const upstream = await fetch(`${url}/events`, {
    headers: { Accept: 'text/event-stream' },
  })

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
