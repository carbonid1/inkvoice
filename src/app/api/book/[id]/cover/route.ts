import { NextRequest, NextResponse } from 'next/server'
import { getBookService } from '@/lib/services'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const bookService = getBookService()

  try {
    const cover = await bookService.getCover(id)
    if (!cover) {
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
