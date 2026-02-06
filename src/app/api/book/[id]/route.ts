import { getBookService } from '@/lib/services/book/book.service'
import { NextRequest, NextResponse } from 'next/server'

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

export const GET = async (_: NextRequest, { params }: RouteParams) => {
  const { id } = await params
  const bookService = getBookService()

  try {
    const overview = await bookService.getBookOverview(id)
    if (!overview) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }
    return NextResponse.json(overview)
  } catch (error) {
    console.error('Error parsing book:', error)
    return NextResponse.json({ error: 'Failed to parse book' }, { status: 500 })
  }
}
