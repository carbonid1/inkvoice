import { NextResponse } from 'next/server'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { getBookMetadata } from '@/lib/epub'

const BOOKS_DIR = join(process.cwd(), 'data', 'books')

export interface BookInfo {
  id: string
  title: string
  author: string
  filename: string
}

export async function GET() {
  try {
    if (!existsSync(BOOKS_DIR)) {
      return NextResponse.json([])
    }

    const files = await readdir(BOOKS_DIR)
    const epubFiles = files.filter((f) => f.endsWith('.epub'))

    const books: BookInfo[] = await Promise.all(
      epubFiles.map(async (filename) => {
        const filePath = join(BOOKS_DIR, filename)
        const id = filename.replace('.epub', '').replace(/[^a-zA-Z0-9-_]/g, '_')

        try {
          const buffer = await readFile(filePath)
          const arrayBuffer = buffer.buffer.slice(
            buffer.byteOffset,
            buffer.byteOffset + buffer.byteLength
          )
          const metadata = await getBookMetadata(arrayBuffer as ArrayBuffer)

          return {
            id,
            title: metadata.title,
            author: metadata.author,
            filename,
          }
        } catch (e) {
          console.error(`Failed to read metadata for ${filename}:`, e)
          return {
            id,
            title: filename.replace('.epub', ''),
            author: 'Unknown',
            filename,
          }
        }
      })
    )

    return NextResponse.json(books)
  } catch (error) {
    console.error('Error listing books:', error)
    return NextResponse.json({ error: 'Failed to list books' }, { status: 500 })
  }
}
