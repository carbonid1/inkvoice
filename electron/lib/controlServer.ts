import http, { IncomingMessage, ServerResponse } from 'http'
import { LifecycleStatus, PythonLifecycle, StateChangeEvent } from './pythonLifecycle'

const ENSURE_TIMEOUT_MS = 5 * 60 * 1_000

const writeJson = (res: ServerResponse, status: number, body: unknown): void => {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

const handleEnsure = async (
  req: IncomingMessage,
  lifecycle: PythonLifecycle,
  res: ServerResponse,
): Promise<void> => {
  let clientDisconnected = false
  req.on('close', () => {
    if (!res.writableEnded) clientDisconnected = true
  })

  try {
    const result = await Promise.race([
      lifecycle.ensureRunning(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('ensure timeout')), ENSURE_TIMEOUT_MS),
      ),
    ])
    if (clientDisconnected) return
    writeJson(res, 200, { url: result.url, instanceId: result.instanceId, state: 'ready' })
  } catch (e) {
    if (clientDisconnected) return
    const message = e instanceof Error ? e.message : String(e)
    writeJson(res, 503, { error: message })
  }
}

const handleStatus = (lifecycle: PythonLifecycle, res: ServerResponse): void => {
  const status: LifecycleStatus = lifecycle.getStatus()
  writeJson(res, 200, status)
}

const handleEvents = (lifecycle: PythonLifecycle, res: ServerResponse): void => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  const send = (event: StateChangeEvent | LifecycleStatus): void => {
    res.write(`data: ${JSON.stringify(event)}\n\n`)
  }

  // First event = current state for reconnect sync
  send(lifecycle.getStatus())

  const off = lifecycle.onStateChange(send)
  // Heartbeat every 30s to keep proxies alive
  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 30_000)

  res.on('close', () => {
    off()
    clearInterval(heartbeat)
  })
}

const route = async (
  req: IncomingMessage,
  res: ServerResponse,
  lifecycle: PythonLifecycle,
): Promise<void> => {
  const url = req.url ?? ''
  const method = req.method ?? 'GET'

  if (method === 'POST' && url === '/ensure') return handleEnsure(req, lifecycle, res)
  if (method === 'GET' && url === '/status') return handleStatus(lifecycle, res)
  if (method === 'GET' && url === '/events') return handleEvents(lifecycle, res)
  if (method === 'POST' && url === '/touch') {
    lifecycle.touch()
    writeJson(res, 200, {})
    return
  }
  if (method === 'POST' && url === '/release') {
    // Intentional no-op — idle timer handles teardown
    writeJson(res, 200, {})
    return
  }
  writeJson(res, 404, { error: 'not found' })
}

export type ControlServer = {
  url: string
  close: () => void
}

export const startControlServer = async (
  lifecycle: PythonLifecycle,
  port: number,
): Promise<ControlServer> => {
  const server = http.createServer((req, res) => {
    void route(req, res, lifecycle).catch(e => {
      const message = e instanceof Error ? e.message : String(e)
      writeJson(res, 500, { error: message })
    })
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', () => {
      server.off('error', reject)
      resolve()
    })
  })

  return {
    url: `http://127.0.0.1:${port}`,
    close: () => server.close(),
  }
}
