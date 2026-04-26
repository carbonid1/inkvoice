import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { createPythonClient } from './pythonClient'

describe('pythonClient', () => {
  let fetchSpy: MockInstance<typeof fetch>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('routes through control plane and forwards to returned URL', async () => {
    fetchSpy
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ url: 'http://127.0.0.1:50001', instanceId: 1, state: 'ready' }),
        ),
      )
      .mockResolvedValueOnce(new Response('audio-bytes', { status: 200 }))

    const client = createPythonClient({ controlUrl: 'http://127.0.0.1:9999', devBaseUrl: 'unused' })
    const res = await client.fetch('/tts', { method: 'POST' })

    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(fetchSpy.mock.calls[0]?.[0]).toBe('http://127.0.0.1:9999/ensure')
    expect(fetchSpy.mock.calls[1]?.[0]).toBe('http://127.0.0.1:50001/tts')
    expect(res.status).toBe(200)
  })

  it('caches the URL across calls', async () => {
    fetchSpy
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ url: 'http://127.0.0.1:50001', instanceId: 1, state: 'ready' }),
        ),
      )
      .mockResolvedValue(new Response('ok'))

    const client = createPythonClient({ controlUrl: 'http://127.0.0.1:9999', devBaseUrl: 'unused' })
    await client.fetch('/tts')
    await client.fetch('/transcribe')

    expect(fetchSpy).toHaveBeenCalledTimes(3)
    expect(fetchSpy.mock.calls[0]?.[0]).toBe('http://127.0.0.1:9999/ensure')
  })

  it('re-ensures on ECONNREFUSED', async () => {
    const refusedError = Object.assign(new Error('fetch failed'), {
      cause: { code: 'ECONNREFUSED' },
    })

    fetchSpy
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ url: 'http://127.0.0.1:50001', instanceId: 1, state: 'ready' }),
        ),
      )
      .mockRejectedValueOnce(refusedError)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ url: 'http://127.0.0.1:50002', instanceId: 2, state: 'ready' }),
        ),
      )
      .mockResolvedValueOnce(new Response('ok', { status: 200 }))

    const client = createPythonClient({ controlUrl: 'http://127.0.0.1:9999', devBaseUrl: 'unused' })
    const res = await client.fetch('/tts')
    expect(res.status).toBe(200)
    expect(client.getCurrentInstanceId()).toBe(2)
  })

  it('bypasses control plane in dev mode', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('ok'))

    const client = createPythonClient({ controlUrl: null, devBaseUrl: 'http://localhost:8000' })
    await client.fetch('/tts', { method: 'POST' })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy.mock.calls[0]?.[0]).toBe('http://localhost:8000/tts')
  })

  it('returns ready status in dev mode without contacting control plane', async () => {
    const client = createPythonClient({ controlUrl: null, devBaseUrl: 'http://localhost:8000' })
    const status = await client.getStatus()
    expect(status.state).toBe('ready')
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
