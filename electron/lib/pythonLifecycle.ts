import { ChildProcess } from 'child_process'

export type LifecycleState = 'stopped' | 'starting' | 'ready' | 'stopping'

export type StateChangeEvent = {
  state: LifecycleState
  url?: string
  instanceId: number
}

export type LifecycleStatus = {
  state: LifecycleState
  url?: string
  instanceId: number
}

type Spawner = (port: number) => ChildProcess

type HealthChecker = (url: string, signal: AbortSignal) => Promise<boolean>

type Timer = {
  setTimeout: (fn: () => void, ms: number) => unknown
  clearTimeout: (handle: unknown) => void
}

export type PythonLifecycleDeps = {
  spawn: Spawner
  findAvailablePort: () => Promise<number>
  pollHealth: HealthChecker
  idleTimeoutMs: number
  shutdownGraceMs: number
  startupTimeoutMs: number
  healthPollIntervalMs: number
  timer?: Timer
}

export type PythonLifecycle = {
  ensureRunning: () => Promise<{ url: string; instanceId: number }>
  touch: () => void
  forceStop: () => void
  getStatus: () => LifecycleStatus
  onStateChange: (listener: (e: StateChangeEvent) => void) => () => void
  trackRequest: <T>(p: Promise<T>) => Promise<T>
}

const defaultTimer: Timer = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: handle => clearTimeout(handle as ReturnType<typeof setTimeout>),
}

export const createPythonLifecycle = (deps: PythonLifecycleDeps): PythonLifecycle => {
  const timer = deps.timer ?? defaultTimer

  const internal = {
    state: 'stopped' as LifecycleState,
    instanceId: 0,
    url: undefined as string | undefined,
    proc: null as ChildProcess | null,
    activeRequests: 0,
    pendingRestart: false,
    pendingStopAfterDrain: false,
    idleHandle: null as unknown,
    killHandle: null as unknown,
    startPromise: null as Promise<{ url: string; instanceId: number }> | null,
    startAbort: null as AbortController | null,
    listeners: new Set<(e: StateChangeEvent) => void>(),
  }

  const transition = (state: LifecycleState, url?: string): void => {
    internal.state = state
    internal.url = url
    const event: StateChangeEvent = { state, url, instanceId: internal.instanceId }
    for (const listener of internal.listeners) listener(event)
  }

  const cancelIdleTimer = (): void => {
    if (internal.idleHandle !== null) {
      timer.clearTimeout(internal.idleHandle)
      internal.idleHandle = null
    }
  }

  const scheduleIdleStop = (): void => {
    cancelIdleTimer()
    if (internal.state !== 'ready') return
    internal.idleHandle = timer.setTimeout(() => {
      internal.idleHandle = null
      requestStop()
    }, deps.idleTimeoutMs)
  }

  const requestStop = (): void => {
    if (internal.state !== 'ready') return
    if (internal.activeRequests > 0) {
      internal.pendingStopAfterDrain = true
      return
    }
    sendSigterm()
  }

  const sendSigterm = (): void => {
    if (!internal.proc || internal.state !== 'ready') return
    transition('stopping')
    try {
      internal.proc.kill('SIGTERM')
    } catch {
      // proc already gone
    }
    internal.killHandle = timer.setTimeout(() => {
      internal.killHandle = null
      if (internal.proc && internal.state === 'stopping') {
        try {
          internal.proc.kill('SIGKILL')
        } catch {
          // already dead
        }
      }
    }, deps.shutdownGraceMs)
  }

  const handleProcExit = (): void => {
    const wasState = internal.state
    const startAbortRef = internal.startAbort
    if (internal.killHandle !== null) {
      timer.clearTimeout(internal.killHandle)
      internal.killHandle = null
    }
    cancelIdleTimer()
    internal.proc = null
    internal.url = undefined
    transition('stopped')
    internal.startPromise = null
    internal.startAbort = null

    // STARTING crash: surface as failed start (caller's promise rejects via pollHealth abort)
    if (wasState === 'starting' && startAbortRef) {
      startAbortRef.abort()
    }

    if (internal.pendingRestart) {
      internal.pendingRestart = false
      // Fire and forget; next caller of ensureRunning will await the new startPromise
      void spawnNew()
    }
  }

  const spawnNew = (): Promise<{ url: string; instanceId: number }> => {
    if (internal.startPromise) return internal.startPromise

    const startAbort = new AbortController()
    internal.startAbort = startAbort
    transition('starting')

    const promise = (async () => {
      const port = await deps.findAvailablePort()
      const url = `http://127.0.0.1:${port}`
      const proc = deps.spawn(port)
      internal.proc = proc
      internal.instanceId += 1
      // Re-broadcast 'starting' now that URL is known — listeners can render the URL early
      transition('starting', url)

      proc.on('exit', handleProcExit)

      const healthUrl = `${url}/health`
      const deadline = Date.now() + deps.startupTimeoutMs
      while (Date.now() < deadline) {
        if (startAbort.signal.aborted) {
          throw new Error('Python start aborted')
        }
        const stepAbort = new AbortController()
        const stepTimeout = setTimeout(() => stepAbort.abort(), 3_000)
        const linkedAbort = () => stepAbort.abort()
        startAbort.signal.addEventListener('abort', linkedAbort)
        try {
          const ok = await deps.pollHealth(healthUrl, stepAbort.signal)
          if (ok) {
            transition('ready', url)
            scheduleIdleStop()
            return { url, instanceId: internal.instanceId }
          }
        } catch {
          // not ready
        } finally {
          clearTimeout(stepTimeout)
          startAbort.signal.removeEventListener('abort', linkedAbort)
        }
        await new Promise(r => setTimeout(r, deps.healthPollIntervalMs))
      }
      throw new Error('Python failed to become ready before timeout')
    })()
      .catch(err => {
        // Ensure proc is killed on startup failure
        if (internal.proc && internal.state !== 'stopped') {
          try {
            internal.proc.kill('SIGKILL')
          } catch {
            // ignore
          }
        }
        throw err
      })
      .finally(() => {
        if (internal.startPromise === promise) {
          internal.startPromise = null
          internal.startAbort = null
        }
      })

    internal.startPromise = promise
    return promise
  }

  const ensureRunning = async (): Promise<{ url: string; instanceId: number }> => {
    cancelIdleTimer()
    internal.pendingStopAfterDrain = false

    if (internal.state === 'ready' && internal.url) {
      const result = { url: internal.url, instanceId: internal.instanceId }
      scheduleIdleStop()
      return result
    }
    if (internal.state === 'starting' && internal.startPromise) {
      return internal.startPromise
    }
    if (internal.state === 'stopping') {
      // SIGTERM already sent; queue a restart for after STOPPED
      internal.pendingRestart = true
      return new Promise((resolve, reject) => {
        const off = onStateChange(e => {
          if (e.state === 'ready' && e.url) {
            off()
            resolve({ url: e.url, instanceId: e.instanceId })
          } else if (e.state === 'stopped') {
            // proc.on('exit') will trigger spawnNew via pendingRestart;
            // keep listening for the resulting ready
          }
        })
        // Safety: if 60s elapse without ready, reject
        timer.setTimeout(() => {
          off()
          reject(new Error('Restart after stop timed out'))
        }, deps.startupTimeoutMs + deps.shutdownGraceMs)
      })
    }
    return spawnNew()
  }

  const touch = (): void => {
    if (internal.state === 'ready') scheduleIdleStop()
  }

  const forceStop = (): void => {
    cancelIdleTimer()
    if (internal.killHandle !== null) {
      timer.clearTimeout(internal.killHandle)
      internal.killHandle = null
    }
    internal.pendingRestart = false
    internal.pendingStopAfterDrain = false
    if (internal.startAbort) internal.startAbort.abort()
    if (internal.proc) {
      try {
        internal.proc.kill('SIGKILL')
      } catch {
        // already dead
      }
    }
  }

  const getStatus = (): LifecycleStatus => ({
    state: internal.state,
    url: internal.url,
    instanceId: internal.instanceId,
  })

  const onStateChange = (listener: (e: StateChangeEvent) => void): (() => void) => {
    internal.listeners.add(listener)
    return () => {
      internal.listeners.delete(listener)
    }
  }

  const trackRequest = async <T>(p: Promise<T>): Promise<T> => {
    internal.activeRequests += 1
    try {
      return await p
    } finally {
      internal.activeRequests -= 1
      if (internal.activeRequests === 0 && internal.pendingStopAfterDrain) {
        internal.pendingStopAfterDrain = false
        sendSigterm()
      }
    }
  }

  return { ensureRunning, touch, forceStop, getStatus, onStateChange, trackRequest }
}
