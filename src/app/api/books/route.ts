import { NextResponse } from 'next/server'
import { getBookIdFromFilename, listEpubFiles } from '@/lib/services/book/book.helpers'
import { getBookService } from '@/lib/services/book/book.service'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB

export const GET = async () => {
  try {
    const bookService = getBookService()
    const books = await bookService.listBooks()

    return NextResponse.json(books)
  } catch (error) {
    console.error('Error listing books:', error)
    return NextResponse.json({ error: 'Failed to list books' }, { status: 500 })
  }
}

export const POST = async (request: Request) => {
  try {
    const contentLength = Number(request.headers.get('content-length') ?? 0)

    if (contentLength > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large (max 100 MB)', code: 'TOO_LARGE' },
        { status: 413 },
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided', code: 'MISSING_FILE' }, { status: 400 })
    }

    const filename = file.name

    if (!filename.endsWith('.epub')) {
      return NextResponse.json(
        { error: 'Only .epub files are supported', code: 'INVALID_TYPE' },
        { status: 400 },
      )
    }

    // Check for duplicate filename
    const existing = await listEpubFiles()
    const newId = getBookIdFromFilename(filename)
    const duplicate = existing.find(f => getBookIdFromFilename(f) === newId)

    if (duplicate) {
      return NextResponse.json(
        { error: 'A book with this filename already exists', code: 'DUPLICATE' },
        { status: 409 },
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const bookService = getBookService()
    const book = await bookService.uploadBook(filename, buffer)

    return NextResponse.json(book)
  } catch (error) {
    console.error('Error uploading book:', error)
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL' }, { status: 500 })
  }
}
