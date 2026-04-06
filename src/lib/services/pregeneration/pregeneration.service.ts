import { env } from '@/lib/config/env'
import { getBookService } from '@/lib/services/book/book.service'
import { getCacheService } from '@/lib/services/cache/cache.service'
import { diskSpaceService } from '@/lib/services/platform/diskSpace'
import { pregenEvents } from '@/lib/services/pregenEvents/pregenEvents.service'
import { pregenQueueService } from '@/lib/services/pregenQueue/pregenQueue.service'
import { getTTSService } from '@/lib/services/tts/tts.server'

import { PREGEN_JOB_STATUS, type PregenJob } from '@/lib/services/pregenQueue/pregenQueue.types'
import { DEFAULT_VOICE } from '@/lib/services/voice/voice.consts'

const WARMUP_TIMEOUT_MS = 180_000
const POLL_INTERVAL_MS = 5000
const MIN_DISK_PERCENT_FREE = 10
const CACHED_SKIP_EMIT_INTERVAL = 10
const DISK_CHECK_INTERVAL = 50
const MAX_RETRIES_PER_PARAGRAPH = 5
const BASE_BACKOFF_MS = 2_000
const MAX_BACKOFF_MS = 30_000

const getBackoffMs = (attempt: number): number =>
  Math.min(BASE_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS)

type PregenWorkerState = {
  running: boolean
  loopId: number
  ttsWarmedUp: boolean
  stoppedJobIds: Set<string>
}

const createPregenWorkerState = (): PregenWorkerState => ({
  running: false,
  loopId: 0,
  ttsWarmedUp: false,
  stoppedJobIds: new Set(),
})

const globalForPregenWorker = globalThis as unknown as {
  pregenWorkerState: PregenWorkerState | undefined
}

const state = globalForPregenWorker.pregenWorkerState ?? createPregenWorkerState()

if (process.env.NODE_ENV !== 'production') {
  globalForPregenWorker.pregenWorkerState = state
}

// No `if (state.running) return` guard — start() must always spawn a fresh loop.
// The previous loop exits via loopId mismatch. This ensures recovery from
// silent loop death (e.g., HMR module reload dropping the async continuation).
const start = (): void => {
  state.running = true
  state.loopId++
  processLoop(state.loopId)
}

const stop = (): void => {
  state.running = false
  state.loopId++
}

const isRunning = (): boolean => state.running

const signalStop = (jobId: string): void => {
  state.stoppedJobIds.add(jobId)
}

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

const emitJob = (job: PregenJob, samplingRate?: number): void => {
  pregenEvents.emit({ type: 'update', job, samplingRate })
}

const warmUpTTS = async (): Promise<void> => {
  if (state.ttsWarmedUp) return
  console.warn('[pregen] Warming up TTS model...')
  const start = Date.now()
  while (!state.ttsWarmedUp) {
    try {
      const response = await fetch(env.ttsApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'The morning sun cast long shadows across the cobblestone street as the old merchant opened his shop for the first time in years. Dust motes danced in the golden light that streamed through the windows, illuminating rows of forgotten treasures on the shelves. He paused for a moment, breathing in the familiar scent of aged wood and leather, remembering the countless customers who had once filled this space with laughter and conversation. Today would be different, he told himself, adjusting the sign that hung crookedly above the door.',
          voice: DEFAULT_VOICE,
        }),
        signal: AbortSignal.timeout(WARMUP_TIMEOUT_MS),
      })
      await response.arrayBuffer()
      if (!response.ok) throw new Error(`${response.status}`)
      state.ttsWarmedUp = true
    } catch {
      await sleep(5_000)
    }
  }
  console.warn(`[pregen] TTS ready (${((Date.now() - start) / 1000).toFixed(1)}s)`)
}

const processLoop = async (myLoopId: number): Promise<void> => {
  while (state.running && state.loopId === myLoopId) {
    try {
      const job = await pregenQueueService.getNext()
      if (!job) {
        await sleep(POLL_INTERVAL_MS)
        continue
      }

      await warmUpTTS()
      await processJob(job, myLoopId)
    } catch {
      await sleep(1000)
    }
  }
}

const processJob = async (job: PregenJob, myLoopId: number): Promise<void> => {
  const fresh = await pregenQueueService.getJob(job.id)
  if (!fresh || fresh.status === PREGEN_JOB_STATUS.PAUSED) return

  const started = await pregenQueueService.start(job.id)
  emitJob(started)

  const bookService = getBookService()
  const cacheService = getCacheService()
  const overview = await bookService.getBookOverview(job.bookId)
  if (!overview) {
    const paused = await pregenQueueService.pause(job.id, 'Book not found')
    emitJob(paused)
    return
  }

  let completedParagraphs = job.completedParagraphs
  let cumulativeDurationMs = job.generatedDurationMs
  let cachedSkipsSinceEmit = 0

  for (let ch = job.currentChapter; ch < overview.chapters.length; ch++) {
    const chapter = overview.chapters[ch]
    if (!chapter) continue
    const startPara = ch === job.currentChapter ? job.currentParagraph : 0

    for (let para = startPara; para < chapter.paragraphCount; para++) {
      // Worker restart → requeue so job gets picked up again
      if (state.loopId !== myLoopId || !state.running) {
        const requeued = await pregenQueueService.resume(job.id)
        emitJob(requeued)
        return
      }

      if (state.stoppedJobIds.has(job.id)) {
        state.stoppedJobIds.delete(job.id)
        return
      }

      if (completedParagraphs % DISK_CHECK_INTERVAL === 0) {
        try {
          const diskInfo = await diskSpaceService.getAvailableSpace(env.cacheDir)
          if (diskInfo.percentFree < MIN_DISK_PERCENT_FREE) {
            const availGB = (diskInfo.available / 1024 / 1024 / 1024).toFixed(2)
            const totalGB = (diskInfo.total / 1024 / 1024 / 1024).toFixed(2)
            console.error(
              `[pregen] Disk space low — ${diskInfo.percentFree}% free (${availGB} GB / ${totalGB} GB), threshold: ${MIN_DISK_PERCENT_FREE}%, path: ${env.cacheDir}`,
            )
            const paused = await pregenQueueService.pause(job.id, 'Disk space low')
            emitJob(paused)
            return
          }
        } catch {
          // Disk check failed — continue anyway
        }
      }

      const text = await bookService.getParagraph(job.bookId, ch, para)
      if (!text) continue

      // Skip already-cached paragraphs (batch emit to avoid flooding)
      const isCached = await cacheService.has(text, job.voice)
      if (isCached) {
        completedParagraphs++
        cumulativeDurationMs += await cacheService.getDurationMs(text, job.voice)
        cachedSkipsSinceEmit++
        const updated = await pregenQueueService.updateProgress(
          job.id,
          ch,
          para,
          completedParagraphs,
          cumulativeDurationMs,
        )
        if (cachedSkipsSinceEmit >= CACHED_SKIP_EMIT_INTERVAL) {
          emitJob(updated)
          cachedSkipsSinceEmit = 0
        }
        continue
      }

      // Flush any pending cached skip progress before TTS
      if (cachedSkipsSinceEmit > 0) {
        const current = await pregenQueueService.getJob(job.id)
        if (current) emitJob(current)
        cachedSkipsSinceEmit = 0
      }

      let generated = false
      for (let attempt = 0; attempt <= MAX_RETRIES_PER_PARAGRAPH; attempt++) {
        if (attempt > 0) {
          await sleep(getBackoffMs(attempt - 1))
          if (state.loopId !== myLoopId || !state.running) {
            const requeued = await pregenQueueService.resume(job.id)
            emitJob(requeued)
            return
          }
          if (state.stoppedJobIds.has(job.id)) {
            state.stoppedJobIds.delete(job.id)
            return
          }
        }

        try {
          const ttsService = getTTSService()
          const { audio, timestamps, durationMs, samplingRate } = await ttsService.generate(
            text,
            job.voice,
          )

          cacheService.set(text, job.voice, audio, job.bookId, durationMs).catch(() => {})
          if (timestamps) {
            cacheService.setTimestamps(text, job.voice, timestamps).catch(() => {})
          }

          completedParagraphs++
          cumulativeDurationMs += durationMs
          const updated = await pregenQueueService.updateProgress(
            job.id,
            ch,
            para,
            completedParagraphs,
            cumulativeDurationMs,
          )
          emitJob(updated, samplingRate ?? undefined)
          generated = true
          break
        } catch (error) {
          console.warn(
            `[pregen] TTS attempt ${attempt + 1}/${MAX_RETRIES_PER_PARAGRAPH + 1} failed for ${job.bookId} ch${ch} p${para}:`,
            error,
          )
        }
      }

      if (!generated) {
        const paused = await pregenQueueService.pause(
          job.id,
          `Chapter ${ch + 1}, paragraph ${para + 1}: failed after ${MAX_RETRIES_PER_PARAGRAPH} retries`,
        )
        emitJob(paused)
        return
      }
    }
  }

  const completed = await pregenQueueService.complete(job.id)
  emitJob(completed)
}

export { signalStop }

export const pregenWorker = {
  start,
  stop,
  isRunning,
}

export const resetPregenWorker = (): void => {
  state.running = false
  state.loopId++
  state.ttsWarmedUp = false
  state.stoppedJobIds.clear()
}

// Auto-recover: if module re-evaluates (HMR) but loop died, restart for pending jobs.
// Also reset orphaned in_progress jobs back to queued (from server restart or zombie loop death).
if (!state.running) {
  pregenQueueService
    .getAll()
    .then(jobs => {
      const orphaned = jobs.filter(j => j.status === PREGEN_JOB_STATUS.IN_PROGRESS)
      const hasWork = jobs.some(
        j => j.status === PREGEN_JOB_STATUS.QUEUED || j.status === PREGEN_JOB_STATUS.IN_PROGRESS,
      )
      if (orphaned.length > 0) {
        Promise.allSettled(orphaned.map(j => pregenQueueService.resume(j.id)))
          .then(() => {
            if (hasWork) start()
          })
          .catch(() => {})
      } else if (hasWork) {
        start()
      }
    })
    .catch(() => {})
}
