import { NextRequest, NextResponse } from 'next/server'
import { getBookService } from '@/lib/services'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const bookService = getBookService()

  try {
    const book = await bookService.getBook(id)
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }
    return NextResponse.json(book)
  } catch (error) {
    console.error('Error parsing book:', error)
    return NextResponse.json({ error: 'Failed to parse book' }, { status: 500 })
  }
}
