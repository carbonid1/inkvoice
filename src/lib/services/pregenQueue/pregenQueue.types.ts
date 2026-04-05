export type PregenJobStatus = 'queued' | 'in_progress' | 'paused' | 'completed'

export const PREGEN_JOB_STATUS = {
  QUEUED: 'queued',
  IN_PROGRESS: 'in_progress',
  PAUSED: 'paused',
  COMPLETED: 'completed',
} as const satisfies Record<string, PregenJobStatus>

export type PregenJob = {
  id: string
  bookId: string
  voice: string
  status: PregenJobStatus
  totalParagraphs: number
  completedParagraphs: number
  generatedDurationMs: number
  currentChapter: number
  currentParagraph: number
  errorMessage: string | null
  createdAt: number
  updatedAt: number
}
