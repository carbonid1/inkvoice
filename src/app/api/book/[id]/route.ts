import { NextRequest, NextResponse } from 'next/server'
import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { parseEpub } from '@/lib/epub'

const BOOKS_DIR = join(process.cwd(), 'data', 'books')

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Find the epub file by matching the id
    const files = await readdir(BOOKS_DIR)
    const epubFile = files.find((f) => {
      const fileId = f.replace('.epub', '').replace(/[^a-zA-Z0-9-_]/g, '_')
      return fileId === id
    })

    if (!epubFile) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    const filePath = join(BOOKS_DIR, epubFile)
    const buffer = await readFile(filePath)
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    )

    const parsedBook = await parseEpub(arrayBuffer as ArrayBuffer, id)

    return NextResponse.json(parsedBook)
  } catch (error) {
    console.error('Error parsing book:', error)
    return NextResponse.json({ error: 'Failed to parse book' }, { status: 500 })
  }
}
