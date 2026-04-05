import type { PregenJob } from '@/lib/services/pregenQueue/pregenQueue.types'

export type PregenUpdateEvent = {
  type: 'update'
  job: PregenJob
}

export type PregenDeletedEvent = {
  type: 'deleted'
  bookId: string
}

export type PregenEvent = PregenUpdateEvent | PregenDeletedEvent

export type PregenEventListener = (event: PregenEvent) => void
