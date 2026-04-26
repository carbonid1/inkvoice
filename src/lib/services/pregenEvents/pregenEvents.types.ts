import type { PregenJob } from '@/lib/services/pregenQueue/pregenQueue.types'

export interface PregenUpdateEvent {
  type: 'update'
  job: PregenJob
  samplingRate?: number
}

export interface PregenDeletedEvent {
  type: 'deleted'
  bookId: string
}

export interface PregenWarmupStartEvent {
  type: 'warmup_start'
  bookId: string
}

export interface PregenWarmupCompleteEvent {
  type: 'warmup_complete'
  bookId: string
}

export type PregenEvent =
  | PregenUpdateEvent
  | PregenDeletedEvent
  | PregenWarmupStartEvent
  | PregenWarmupCompleteEvent

export type PregenEventListener = (event: PregenEvent) => void
