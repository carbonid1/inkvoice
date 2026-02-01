import { NextRequest, NextResponse } from 'next/server'
import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { parseEpub } from '@/lib/epub'
import { ttsCache } from '@/lib/tts-cache'

const BOOKS_DIR = join(process.cwd(), 'data', 'books')
const TTS_API_URL = 'http://localhost:8000/tts'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string; chapter: string; sentence: string }> }
) {
  try {
    const { bookId, chapter, sentence } = await params
    const voice = request.nextUrl.searchParams.get('voice') || 'narrator'

    const chapterIdx = parseInt(chapter, 10)
    const sentenceIdx = parseInt(sentence, 10)

    if (isNaN(chapterIdx) || isNaN(sentenceIdx)) {
      return NextResponse.json({ error: 'Invalid chapter or sentence index' }, { status: 400 })
    }

    // Find and parse the book to get the sentence text
    const files = await readdir(BOOKS_DIR)
    const epubFile = files.find((f) => {
      const fileId = f.replace('.epub', '').replace(/[^a-zA-Z0-9-_]/g, '_')
      return fileId === bookId
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

    const parsedBook = await parseEpub(arrayBuffer as ArrayBuffer, bookId)

    // Get the sentence text
    const chapterData = parsedBook.chapters[chapterIdx]
    if (!chapterData) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    const text = chapterData.sentences[sentenceIdx]
    if (!text) {
      return NextResponse.json({ error: 'Sentence not found' }, { status: 404 })
    }

    // Check disk cache first
    const cached = await ttsCache.get(text, voice)
    if (cached) {
      const stats = await ttsCache.getStats()
      return new NextResponse(new Uint8Array(cached), {
        headers: {
          'Content-Type': 'audio/wav',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Cache': 'HIT',
          'X-Cache-Used': stats.usedBytes.toString(),
          'X-Cache-Max': stats.maxBytes.toString(),
        },
      })
    }

    // Call Python TTS API
    const response = await fetch(TTS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { error: `TTS API error: ${error}` },
        { status: response.status }
      )
    }

    const audioBuffer = await response.arrayBuffer()
    const audioData = Buffer.from(audioBuffer)

    // Store in cache and get updated stats
    await ttsCache.set(text, voice, audioData).catch((err) => {
      console.error('Failed to cache TTS audio:', err)
    })
    const stats = await ttsCache.getStats()

    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Cache': 'MISS',
        'X-Cache-Used': stats.usedBytes.toString(),
        'X-Cache-Max': stats.maxBytes.toString(),
      },
    })
  } catch (error) {
    console.error('TTS error:', error)

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'TTS API is not running. Please start the Python server.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    )
  }
}
