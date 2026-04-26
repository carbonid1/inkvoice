'use client'

import type { LifecycleState, LifecycleStatus } from '@/lib/services/pythonClient/pythonClient.types'
import { useEffect } from 'react'
import { create } from 'zustand'

export type { LifecycleState }

type Store = LifecycleStatus & {
  setSnapshot: (s: LifecycleStatus) => void
}

export const useTTSLifecycleStore = create<Store>((set, get) => ({
  state: 'stopped',
  url: undefined,
  instanceId: 0,
  setSnapshot: snapshot => {
    const cur = get()
    if (
      cur.state === snapshot.state &&
      cur.url === snapshot.url &&
      cur.instanceId === snapshot.instanceId
    ) {
      return
    }
    set(snapshot)
  },
}))

let connected = false

export const useTTSLifecycle = () => {
  const setSnapshot = useTTSLifecycleStore(s => s.setSnapshot)

  useEffect(() => {
    if (connected) return
    connected = true

    const eventSource = new EventSource('/api/tts/lifecycle/events')

    eventSource.onmessage = e => {
      try {
        const raw: unknown = JSON.parse(e.data)
        if (typeof raw !== 'object' || raw === null) return
        const data: Record<string, unknown> = { ...raw }
        const state = data.state
        if (
          state !== 'stopped' &&
          state !== 'starting' &&
          state !== 'ready' &&
          state !== 'stopping'
        )
          return
        const url = typeof data.url === 'string' ? data.url : undefined
        const instanceId = typeof data.instanceId === 'number' ? data.instanceId : 0
        setSnapshot({ state, url, instanceId })
      } catch {
        // ignore malformed
      }
    }

    eventSource.onerror = () => {
      // EventSource auto-reconnects; reset to stopped while disconnected
      setSnapshot({ state: 'stopped', instanceId: 0 })
    }

    return () => {
      eventSource.close()
      connected = false
    }
  }, [setSnapshot])
}
