import type {
  VoiceSampleEvent,
  VoiceSampleEventListener,
  VoiceSampleStatus,
} from './voiceSampleEvents.types'

// Subscribers that connect after the sample finished still need the outcome,
// so we cache the latest event per voice for a window long enough to cover a
// panel close/reopen. TTL is self-evicting — no periodic sweep needed.
const RECENT_OUTCOME_TTL_MS = 5 * 60 * 1000

interface VoiceSampleEventBus {
  on: (listener: VoiceSampleEventListener) => void
  off: (listener: VoiceSampleEventListener) => void
  publish: (voiceName: string, status: VoiceSampleStatus) => void
  getRecent: () => VoiceSampleEvent[]
}

declare global {
  var voiceSampleEvents: VoiceSampleEventBus | undefined
}

interface RecentEntry {
  event: VoiceSampleEvent
  timeoutId: ReturnType<typeof setTimeout>
}

const createVoiceSampleEvents = (): VoiceSampleEventBus => {
  const listeners = new Set<VoiceSampleEventListener>()
  const recent = new Map<string, RecentEntry>()

  const dropRecent = (voiceName: string) => {
    const entry = recent.get(voiceName)

    if (!entry) return
    clearTimeout(entry.timeoutId)
    recent.delete(voiceName)
  }

  return {
    on: listener => {
      listeners.add(listener)
    },
    off: listener => {
      listeners.delete(listener)
    },
    publish: (voiceName, status) => {
      const event: VoiceSampleEvent = { type: 'sample', voiceName, status }

      dropRecent(voiceName)
      const timeoutId = setTimeout(() => recent.delete(voiceName), RECENT_OUTCOME_TTL_MS)

      recent.set(voiceName, { event, timeoutId })
      for (const listener of listeners) listener(event)
    },
    getRecent: () => Array.from(recent.values(), entry => entry.event),
  }
}

export const voiceSampleEvents = globalThis.voiceSampleEvents ?? createVoiceSampleEvents()

if (process.env.NODE_ENV !== 'production') {
  globalThis.voiceSampleEvents = voiceSampleEvents
}
