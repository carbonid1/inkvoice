import { getBookService } from '@/lib/services/book/book.service'
import { getCacheService } from '@/lib/services/cache/cache.service'
import { checkBudget } from '@/lib/services/cache/helpers/checkBudget/checkBudget'
import { pregenEvents } from '@/lib/services/pregenEvents/pregenEvents.service'
import { pregenQueueService } from '@/lib/services/pregenQueue/pregenQueue.service'
import { computePregenEstimate } from '@/lib/services/pregeneration/helpers/computePregenEstimate/computePregenEstimate'
import { pregenWorker, signalStop } from '@/lib/services/pregeneration/pregeneration.service'
import { voicePreferenceService } from '@/lib/services/voice-preference/voice-preference.service'
import { NextRequest, NextResponse } from 'next/server'

type RouteParams = { params: Promise<{ bookId: string }> }

export const POST = async (request: NextRequest, { params }: RouteParams) => {
  const { bookId } = await params

  const startChapter = parseInt(request.nextUrl.searchParams.get('startChapter') ?? '0', 10)

  try {
    // Early guard — cheap DB query
    const existing = await pregenQueueService.getByBookId(bookId)
    if (existing) {
      return NextResponse.json(
        { error: 'Pre-generation already active for this book' },
        { status: 409 },
      )
    }

    // Parallel reads
    const [overview, voicePrefs] = await Promise.all([
      getBookService().getBookOverview(bookId),
      voicePreferenceService.getAll(),
    ])

    if (!overview) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    const totalParagraphs = overview.chapters.reduce((sum, ch) => sum + ch.paragraphCount, 0)
    const totalWords = overview.chapters.reduce((sum, ch) => sum + ch.wordCount, 0)
    const voice = voicePrefs.bookVoices[bookId] ?? voicePrefs.voice

    const cacheService = getCacheService()
    const [cachedParagraphs, stats] = await Promise.all([
      cacheService.countBookVoiceEntries(bookId, voice),
      cacheService.getStats(),
    ])

    const { estimatedSizeBytes } = computePregenEstimate({
      totalParagraphs,
      totalWords,
      cachedParagraphs,
    })

    const budget = checkBudget({
      usedBytes: stats.usedBytes,
      maxBytes: stats.maxBytes,
      estimatedBytes: estimatedSizeBytes,
    })

    if (!budget.ok) {
      return NextResponse.json({ error: 'Cache budget exceeded', budget }, { status: 409 })
    }

    const job = await pregenQueueService.enqueue(bookId, voice, totalParagraphs, startChapter)

    pregenWorker.start()

    pregenEvents.emit({ type: 'update', job })
    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    console.error('Failed to start pre-generation:', error)
    return NextResponse.json({ error: 'Failed to start pre-generation' }, { status: 500 })
  }
}

export const GET = async (_request: NextRequest, { params }: RouteParams) => {
  const { bookId } = await params
  const job = await pregenQueueService.getByBookId(bookId)

  if (!job) {
    return NextResponse.json({ error: 'No active pre-generation for this book' }, { status: 404 })
  }

  return NextResponse.json(job)
}

export const DELETE = async (_request: NextRequest, { params }: RouteParams) => {
  const { bookId } = await params
  const job = await pregenQueueService.getAnyByBookId(bookId)

  if (!job) {
    return NextResponse.json({ error: 'No pre-generation for this book' }, { status: 404 })
  }

  signalStop(job.id)
  const { deleted } = await pregenQueueService.cancel(job.id)
  if (deleted) pregenEvents.emit({ type: 'deleted', bookId })
  return NextResponse.json({ success: true })
}

export const PATCH = async (request: NextRequest, { params }: RouteParams) => {
  const { bookId } = await params

  let body: { action?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const action = body?.action

  if (action !== 'pause' && action !== 'resume') {
    return NextResponse.json(
      { error: 'Invalid action. Expected "pause" or "resume".' },
      { status: 400 },
    )
  }

  try {
    const job = await pregenQueueService.getByBookId(bookId)
    if (!job) {
      return NextResponse.json({ error: 'No active pre-generation for this book' }, { status: 404 })
    }

    if (action === 'pause') {
      signalStop(job.id)
      await pregenQueueService.pause(job.id)
    } else {
      await pregenQueueService.resume(job.id)
      pregenWorker.start()
    }

    const updated = await pregenQueueService.getByBookId(bookId)
    if (updated) pregenEvents.emit({ type: 'update', job: updated })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update pre-generation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
