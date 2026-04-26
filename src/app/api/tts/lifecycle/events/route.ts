import { makeSSEResponse } from '@/lib/helpers/sseResponse/sseResponse'
import { getPythonClient } from '@/lib/services/pythonClient/pythonClient'

export const dynamic = 'force-dynamic'

const controlUrl = (): string | null => process.env.INKVOICE_PYTHON_CONTROL_URL ?? null

export const GET = async () => {
  const url = controlUrl()

  if (!url) {
    const status = await getPythonClient().getStatus()
    return makeSSEResponse(enqueue => {
      enqueue.data(status)
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
