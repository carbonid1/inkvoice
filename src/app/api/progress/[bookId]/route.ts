import { progressService } from '@/lib/services/progress/progress.service'
import { NextRequest, NextResponse } from 'next/server'

type RouteParams = {
  params: Promise<{
    bookId: string
  }>
}

export const GET = async (_request: NextRequest, { params }: RouteParams) => {
  const { bookId } = await params
  const progress = await progressService.get(bookId)

  if (!progress) {
    return NextResponse.json({ error: 'Progress not found' }, { status: 404 })
  }

  return NextResponse.json(progress)
}

export const PUT = async (request: NextRequest, { params }: RouteParams) => {
  const { bookId } = await params

  try {
    const body = await request.json()
    const { chapter, sentence } = body as { chapter: unknown; sentence: unknown }

    if (
      typeof chapter !== 'number' ||
      typeof sentence !== 'number' ||
      chapter < 0 ||
      sentence < 0 ||
      !Number.isInteger(chapter) ||
      !Number.isInteger(sentence)
    ) {
      return NextResponse.json(
        { error: 'chapter and sentence must be non-negative integers' },
        { status: 400 },
      )
    }

    await progressService.upsert(bookId, body)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
}

export const DELETE = async (_request: NextRequest, { params }: RouteParams) => {
  const { bookId } = await params
  const removed = await progressService.remove(bookId)

  if (!removed) {
    return NextResponse.json({ error: 'Progress not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
