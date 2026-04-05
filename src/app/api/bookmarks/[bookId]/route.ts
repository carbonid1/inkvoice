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

  let body: { chapter: unknown; paragraph: unknown; preview: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { chapter, paragraph, preview } = body

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
    const bookmark = await bookmarkService.addBookmark(
      bookId,
      chapter,
      paragraph,
      typeof preview === 'string' ? preview : undefined,
    )
    return NextResponse.json(bookmark, { status: 201 })
  } catch (error) {
    console.error('Failed to create bookmark:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const DELETE = async (request: NextRequest, { params }: RouteParams) => {
  const { bookId } = await params

  let body: { bookmarkId: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { bookmarkId } = body

  if (typeof bookmarkId !== 'string' || bookmarkId.length === 0) {
    return NextResponse.json({ error: 'bookmarkId must be a non-empty string' }, { status: 400 })
  }

  try {
    const removed = await bookmarkService.removeBookmark(bookId, bookmarkId)
    if (!removed) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove bookmark:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
