import { env } from '@/lib/config/env'
import type { LifecycleStatus, PythonClient } from './pythonClient.types'

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null

const getErrorCauseCode = (e: unknown): string | undefined => {
  if (!(e instanceof Error)) return undefined
  const cause = Reflect.get(e, 'cause')
  if (!isRecord(cause)) return undefined
  const code = cause.code
  return typeof code === 'string' ? code : undefined
}

const isConnRefused = (e: unknown): boolean => {
  if (getErrorCauseCode(e) === 'ECONNREFUSED') return true
  return e instanceof Error && e.message.includes('ECONNREFUSED')
}

type EnsureResponse = { url: string; instanceId: number }

const parseEnsureResponse = (raw: unknown): EnsureResponse => {
  if (!isRecord(raw)) throw new Error('ensure: response is not an object')
  if (typeof raw.url !== 'string') throw new Error('ensure: missing url')
  if (typeof raw.instanceId !== 'number') throw new Error('ensure: missing instanceId')
  return { url: raw.url, instanceId: raw.instanceId }
}

const parseStatusResponse = (raw: unknown): LifecycleStatus => {
  if (!isRecord(raw)) throw new Error('status: response is not an object')
  const state = raw.state
  if (
    state !== 'stopped' &&
    state !== 'starting' &&
    state !== 'ready' &&
    state !== 'stopping'
  ) {
    throw new Error(`status: invalid state ${String(state)}`)
  }
  const url = typeof raw.url === 'string' ? raw.url : undefined
  const instanceId = typeof raw.instanceId === 'number' ? raw.instanceId : 0
  return { state, url, instanceId }
}

export type PythonClientDeps = {
  controlUrl: string | null
  devBaseUrl: string
}

export const createPythonClient = (deps: PythonClientDeps): PythonClient => {
  let cachedUrl: string | null = null
  let currentInstanceId = 0

  const ensureUrl = async (): Promise<string> => {
    if (deps.controlUrl === null) return deps.devBaseUrl
    if (cachedUrl) return cachedUrl

    const response = await fetch(`${deps.controlUrl}/ensure`, {
      method: 'POST',
      signal: AbortSignal.timeout(5 * 60 * 1_000),
    })
    if (!response.ok) {
      const errBody = await response.text().catch(() => '')
      throw new Error(`Python ensure failed: ${response.status} ${errBody}`)
    }
    const body = parseEnsureResponse(await response.json())
    cachedUrl = body.url
    currentInstanceId = body.instanceId
    return body.url
  }

  const clientFetch = async (path: string, init?: RequestInit): Promise<Response> => {
    const attempt = async (): Promise<Response> => {
      const baseUrl = await ensureUrl()
      return await fetch(`${baseUrl}${path}`, init)
    }

    try {
      return await attempt()
    } catch (e) {
      if (!isConnRefused(e)) throw e
      cachedUrl = null
      return await attempt()
    }
  }

  const getStatus = async (): Promise<LifecycleStatus> => {
    if (deps.controlUrl === null) {
      return { state: 'ready', url: deps.devBaseUrl, instanceId: 0 }
    }
    const response = await fetch(`${deps.controlUrl}/status`)
    if (!response.ok) throw new Error(`status fetch failed: ${response.status}`)
    return parseStatusResponse(await response.json())
  }

  return {
    fetch: clientFetch,
    getStatus,
    getCurrentInstanceId: () => currentInstanceId,
  }
}

let _pythonClient: PythonClient | null = null

export const getPythonClient = (): PythonClient => {
  if (!_pythonClient) {
    const controlUrl = process.env.INKVOICE_PYTHON_CONTROL_URL ?? null
    _pythonClient = createPythonClient({
      controlUrl,
      devBaseUrl: env.ttsApiBaseUrl,
    })
  }
  return _pythonClient
}

export const resetPythonClient = (): void => {
  _pythonClient = null
}
