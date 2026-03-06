import { getBookService } from '@/lib/services/book/book.service'
import { NextRequest, NextResponse } from 'next/server'

type RouteParams = {
  params: Promise<{
    id: string
    index: string
  }>
}

export const GET = async (_request: NextRequest, { params }: RouteParams) => {
  const { id, index } = await params
  const chapterIndex = parseInt(index, 10)

  if (isNaN(chapterIndex)) {
    return NextResponse.json({ error: 'Invalid chapter index' }, { status: 400 })
  }

  const bookService = getBookService()

  try {
    const chapter = await bookService.getChapter(id, chapterIndex)
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }
    return NextResponse.json(chapter)
  } catch (error) {
    console.error('Error fetching chapter:', error)
    return NextResponse.json({ error: 'Failed to fetch chapter' }, { status: 500 })
  }
}
