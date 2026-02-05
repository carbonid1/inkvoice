import { NextResponse } from 'next/server'
import { getBookService } from '@/lib/services/book/book.service'

export async function GET() {
  try {
    const bookService = getBookService()
    const books = await bookService.listBooks()
    return NextResponse.json(books)
  } catch (error) {
    console.error('Error listing books:', error)
    return NextResponse.json({ error: 'Failed to list books' }, { status: 500 })
  }
}
