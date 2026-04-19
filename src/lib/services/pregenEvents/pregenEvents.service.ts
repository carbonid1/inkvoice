import type { PregenEvent, PregenEventListener } from './pregenEvents.types'

type PregenEventBus = {
  on: (listener: PregenEventListener) => void
  off: (listener: PregenEventListener) => void
  emit: (event: PregenEvent) => void
  getWarmingUpBookId: () => string | null
}

const createPregenEvents = (): PregenEventBus => {
  const listeners = new Set<PregenEventListener>()
  const state = { warmingUpBookId: null as string | null }

  return {
    on: listener => {
      listeners.add(listener)
    },
    off: listener => {
      listeners.delete(listener)
    },
    emit: event => {
      if (event.type === 'warmup_start') state.warmingUpBookId = event.bookId
      else if (event.type === 'warmup_complete') state.warmingUpBookId = null
      for (const listener of listeners) {
        listener(event)
      }
    },
    getWarmingUpBookId: () => state.warmingUpBookId,
  }
}

const globalForPregenEvents = globalThis as unknown as { pregenEvents: PregenEventBus | undefined }

export const pregenEvents = globalForPregenEvents.pregenEvents ?? createPregenEvents()

if (process.env.NODE_ENV !== 'production') {
  globalForPregenEvents.pregenEvents = pregenEvents
}
