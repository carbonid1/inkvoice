import { NextRequest, NextResponse } from 'next/server'
import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { getCoverImage } from '@/lib/epub'

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
      return new NextResponse(null, { status: 404 })
    }

    const filePath = join(BOOKS_DIR, epubFile)
    const buffer = await readFile(filePath)
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    )

    const cover = await getCoverImage(arrayBuffer as ArrayBuffer)

    if (!cover) {
      // No cover found - return 204 No Content for graceful fallback
      return new NextResponse(null, { status: 204 })
    }

    return new NextResponse(new Uint8Array(cover.data), {
      headers: {
        'Content-Type': cover.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error getting cover:', error)
    return new NextResponse(null, { status: 500 })
  }
}
