import type { PregenEvent, PregenEventListener } from './pregenEvents.types'

interface PregenEventBus {
  on: (listener: PregenEventListener) => void
  off: (listener: PregenEventListener) => void
  emit: (event: PregenEvent) => void
  getWarmingUpBookId: () => string | null
}

declare global {
  var pregenEvents: PregenEventBus | undefined
}

interface WarmupState {
  warmingUpBookId: string | null
}

const createPregenEvents = (): PregenEventBus => {
  const listeners = new Set<PregenEventListener>()
  const state: WarmupState = { warmingUpBookId: null }

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

export const pregenEvents = globalThis.pregenEvents ?? createPregenEvents()

if (process.env.NODE_ENV !== 'production') {
  globalThis.pregenEvents = pregenEvents
}
