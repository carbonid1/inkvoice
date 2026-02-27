import { bookmarkService } from '@/lib/services/bookmark/bookmark.service'
import { NextRequest, NextResponse } from 'next/server'

type RouteParams = {
  params: Promise<{
    bookId: string
  }>
}

export const GET = async (_request: NextRequest, { params }: RouteParams) => {
  const { bookId } = await params
  const bookmarks = await bookmarkService.getBookmarks(bookId)
  return NextResponse.json(bookmarks)
}

export const POST = async (request: NextRequest, { params }: RouteParams) => {
  const { bookId } = await params

  try {
    const body = await request.json()
    const { chapter, sentence, preview } = body as {
      chapter: unknown
      sentence: unknown
      preview: unknown
    }

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

    const bookmark = await bookmarkService.addBookmark(
      bookId,
      chapter,
      sentence,
      typeof preview === 'string' ? preview : undefined,
    )
    return NextResponse.json(bookmark, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
}

export const DELETE = async (request: NextRequest, { params }: RouteParams) => {
  const { bookId } = await params

  try {
    const body = await request.json()
    const { bookmarkId } = body as { bookmarkId: unknown }

    if (typeof bookmarkId !== 'string' || bookmarkId.length === 0) {
      return NextResponse.json({ error: 'bookmarkId must be a non-empty string' }, { status: 400 })
    }

    const removed = await bookmarkService.removeBookmark(bookId, bookmarkId)
    if (!removed) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
}
