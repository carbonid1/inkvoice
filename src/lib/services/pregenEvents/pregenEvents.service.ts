import type { PregenEvent, PregenEventListener } from './pregenEvents.types'

type PregenEventBus = {
  on: (listener: PregenEventListener) => void
  off: (listener: PregenEventListener) => void
  emit: (event: PregenEvent) => void
}

const createPregenEvents = (): PregenEventBus => {
  const listeners = new Set<PregenEventListener>()

  return {
    on: listener => {
      listeners.add(listener)
    },
    off: listener => {
      listeners.delete(listener)
    },
    emit: event => {
      for (const listener of listeners) {
        listener(event)
      }
    },
  }
}

const globalForPregenEvents = globalThis as unknown as { pregenEvents: PregenEventBus | undefined }

export const pregenEvents = globalForPregenEvents.pregenEvents ?? createPregenEvents()

if (process.env.NODE_ENV !== 'production') {
  globalForPregenEvents.pregenEvents = pregenEvents
}
