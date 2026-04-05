import { progressService } from '@/lib/services/progress/progress.service'
import type { Progress } from '@/lib/services/progress/progress.types'
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

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { chapter, paragraph } = body

  if (
    typeof chapter !== 'number' ||
    typeof paragraph !== 'number' ||
    chapter < 0 ||
    paragraph < 0 ||
    !Number.isInteger(chapter) ||
    !Number.isInteger(paragraph)
  ) {
    return NextResponse.json(
      { error: 'chapter and paragraph must be non-negative integers' },
      { status: 400 },
    )
  }

  try {
    await progressService.upsert(bookId, body as Progress)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
