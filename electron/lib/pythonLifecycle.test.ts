import { ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createPythonLifecycle,
  PythonLifecycleDeps,
  StateChangeEvent,
} from './pythonLifecycle'

type FakeProc = EventEmitter & { kill: ReturnType<typeof vi.fn>; killed: boolean }

const createFakeProc = (): FakeProc => {
  const proc = new EventEmitter() as FakeProc
  proc.killed = false
  proc.kill = vi.fn(() => true)
  return proc
}

const setupLifecycle = (overrides: Partial<PythonLifecycleDeps> = {}) => {
  const procs: FakeProc[] = []
  const deps: PythonLifecycleDeps = {
    spawn: vi.fn(() => {
      const proc = createFakeProc()
      procs.push(proc)
      return proc as unknown as ChildProcess
    }),
    findAvailablePort: vi.fn(async () => 50000 + procs.length),
    pollHealth: vi.fn(async () => true),
    idleTimeoutMs: 1000,
    shutdownGraceMs: 100,
    startupTimeoutMs: 5000,
    healthPollIntervalMs: 10,
    ...overrides,
  }
  const lifecycle = createPythonLifecycle(deps)
  return { lifecycle, deps, procs }
}

const hangingPollHealth = () => {
  const handles: Array<{ resolve: (v: boolean) => void; reject: (e: Error) => void }> = []
  const pollHealth = vi.fn((_url: string, signal: AbortSignal) => {
    return new Promise<boolean>((resolve, reject) => {
      handles.push({ resolve, reject })
      signal.addEventListener('abort', () => reject(new Error('aborted')))
    })
  })
  return { pollHealth, handles }
}

describe('pythonLifecycle', () => {
  describe('without fake timers', () => {
    it('spawns Python on first ensureRunning and returns URL', async () => {
      const { lifecycle, deps } = setupLifecycle()
      const result = await lifecycle.ensureRunning()
      expect(result.url).toBe('http://127.0.0.1:50000')
      expect(result.instanceId).toBe(1)
      expect(deps.spawn).toHaveBeenCalledTimes(1)
      expect(lifecycle.getStatus().state).toBe('ready')
    })

    it('shares in-flight start promise across concurrent ensureRunning calls', async () => {
      const { pollHealth, handles } = hangingPollHealth()
      const { lifecycle, deps } = setupLifecycle({ pollHealth })
      const p1 = lifecycle.ensureRunning()
      const p2 = lifecycle.ensureRunning()
      const p3 = lifecycle.ensureRunning()
      // Wait until pollHealth has been called once
      await vi.waitFor(() => expect(handles.length).toBe(1))
      handles[0]!.resolve(true)
      const results = await Promise.all([p1, p2, p3])
      expect(deps.spawn).toHaveBeenCalledTimes(1)
      expect(results[0].instanceId).toBe(1)
      expect(results[1].instanceId).toBe(1)
      expect(results[2].instanceId).toBe(1)
    })

    it('forceStop kills proc immediately regardless of state', async () => {
      const { lifecycle, procs } = setupLifecycle()
      await lifecycle.ensureRunning()
      lifecycle.forceStop()
      expect(procs[0]!.kill).toHaveBeenCalledWith('SIGKILL')
    })

    it('forceStop aborts an in-flight start', async () => {
      const { pollHealth, handles } = hangingPollHealth()
      const { lifecycle, procs } = setupLifecycle({ pollHealth })
      const startPromise = lifecycle.ensureRunning()
      // transition('starting') runs synchronously
      expect(lifecycle.getStatus().state).toBe('starting')
      // Wait until poll is in flight so abort listener is wired
      await vi.waitFor(() => expect(handles.length).toBe(1))
      lifecycle.forceStop()
      expect(procs[0]!.kill).toHaveBeenCalledWith('SIGKILL')
      procs[0]!.emit('exit', 137)
      await expect(startPromise).rejects.toThrow()
    })
  })

  describe('with fake timers', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('transitions to STOPPED when proc exits unexpectedly', async () => {
      const { lifecycle, procs } = setupLifecycle()
      await lifecycle.ensureRunning()
      procs[0]!.emit('exit', 0)
      expect(lifecycle.getStatus().state).toBe('stopped')
    })

    it('schedules SIGTERM after idle timeout', async () => {
      const { lifecycle, procs } = setupLifecycle({ idleTimeoutMs: 500 })
      await lifecycle.ensureRunning()
      expect(procs[0]!.kill).not.toHaveBeenCalled()
      vi.advanceTimersByTime(600)
      expect(procs[0]!.kill).toHaveBeenCalledWith('SIGTERM')
      expect(lifecycle.getStatus().state).toBe('stopping')
    })

    it('escalates to SIGKILL after shutdown grace', async () => {
      const { lifecycle, procs } = setupLifecycle({ idleTimeoutMs: 100, shutdownGraceMs: 200 })
      await lifecycle.ensureRunning()
      vi.advanceTimersByTime(110)
      expect(procs[0]!.kill).toHaveBeenCalledWith('SIGTERM')
      vi.advanceTimersByTime(250)
      expect(procs[0]!.kill).toHaveBeenCalledWith('SIGKILL')
    })

    it('resets idle timer on touch', async () => {
      const { lifecycle, procs } = setupLifecycle({ idleTimeoutMs: 500 })
      await lifecycle.ensureRunning()
      vi.advanceTimersByTime(400)
      lifecycle.touch()
      vi.advanceTimersByTime(400)
      expect(procs[0]!.kill).not.toHaveBeenCalled()
      vi.advanceTimersByTime(200)
      expect(procs[0]!.kill).toHaveBeenCalledWith('SIGTERM')
    })

    it('defers SIGTERM while requests are in flight', async () => {
      const { lifecycle, procs } = setupLifecycle({ idleTimeoutMs: 100 })
      await lifecycle.ensureRunning()
      let resolveReq: () => void = () => {}
      const reqPromise = lifecycle.trackRequest(
        new Promise<void>(resolve => {
          resolveReq = resolve
        }),
      )
      vi.advanceTimersByTime(150)
      expect(procs[0]!.kill).not.toHaveBeenCalled()
      resolveReq()
      await reqPromise
      expect(procs[0]!.kill).toHaveBeenCalledWith('SIGTERM')
    })

    it('restarts after STOPPING when ensureRunning is called mid-stop', async () => {
      const { lifecycle, procs, deps } = setupLifecycle({ idleTimeoutMs: 100 })
      const first = await lifecycle.ensureRunning()
      expect(first.instanceId).toBe(1)
      vi.advanceTimersByTime(150)
      expect(lifecycle.getStatus().state).toBe('stopping')

      const restartPromise = lifecycle.ensureRunning()
      procs[0]!.emit('exit', 0)
      const second = await restartPromise

      expect(second.instanceId).toBe(2)
      expect(deps.spawn).toHaveBeenCalledTimes(2)
      expect(lifecycle.getStatus().state).toBe('ready')
    })

    it('re-allocates a new port on each spawn', async () => {
      const { lifecycle, procs, deps } = setupLifecycle({ idleTimeoutMs: 100 })
      const first = await lifecycle.ensureRunning()
      vi.advanceTimersByTime(150)
      procs[0]!.emit('exit', 0)
      const second = await lifecycle.ensureRunning()
      expect(first.url).not.toBe(second.url)
      expect(deps.findAvailablePort).toHaveBeenCalledTimes(2)
    })

    it('broadcasts state changes to subscribers', async () => {
      const { lifecycle, procs } = setupLifecycle({ idleTimeoutMs: 100 })
      const events: StateChangeEvent[] = []
      lifecycle.onStateChange(e => events.push(e))
      await lifecycle.ensureRunning()
      vi.advanceTimersByTime(150)
      procs[0]!.emit('exit', 0)
      // Filter out duplicate 'starting' events (one before URL, one after)
      const states = events.map(e => e.state).filter((s, i, arr) => s !== arr[i - 1])
      expect(states).toEqual(['starting', 'ready', 'stopping', 'stopped'])
    })
  })
})
