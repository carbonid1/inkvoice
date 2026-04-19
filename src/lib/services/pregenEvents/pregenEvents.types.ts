import type { PregenJob } from '@/lib/services/pregenQueue/pregenQueue.types'

export type PregenUpdateEvent = {
  type: 'update'
  job: PregenJob
  samplingRate?: number
}

export type PregenDeletedEvent = {
  type: 'deleted'
  bookId: string
}

export type PregenWarmupStartEvent = {
  type: 'warmup_start'
  bookId: string
}

export type PregenWarmupCompleteEvent = {
  type: 'warmup_complete'
  bookId: string
}

export type PregenEvent =
  | PregenUpdateEvent
  | PregenDeletedEvent
  | PregenWarmupStartEvent
  | PregenWarmupCompleteEvent

export type PregenEventListener = (event: PregenEvent) => void
