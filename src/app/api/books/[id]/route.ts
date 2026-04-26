import { NextResponse } from 'next/server'
import { getBookService } from '@/lib/services/book/book.service'
import { validateBookId } from './helpers/validateBookId/validateBookId'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const DELETE = async (_request: Request, { params }: RouteContext) => {
  const { id } = await params

  const invalid = validateBookId(id)

  if (invalid) return invalid

  const bookService = getBookService()
  const deleted = await bookService.deleteBook(id)

  if (!deleted) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}

export const PATCH = async (_request: Request, { params }: RouteContext) => {
  const { id } = await params

  const invalid = validateBookId(id)

  if (invalid) return invalid

  const bookService = getBookService()
  const restored = await bookService.restoreBook(id)

  if (!restored) {
    return NextResponse.json({ error: 'No deleted book found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
