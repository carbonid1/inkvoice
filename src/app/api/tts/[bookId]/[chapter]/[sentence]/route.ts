import { parseChunkingMode } from '@/app/api/helpers/parseChunkingMode/parseChunkingMode'
import { getBookService } from '@/lib/services/book/book.service'
import { getCacheService } from '@/lib/services/cache/cache.service'
import { pronunciationService } from '@/lib/services/pronunciation/pronunciation.service'
import { getTTSService } from '@/lib/services/tts/tts.server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string; chapter: string; sentence: string }> },
) {
  const { bookId, chapter, sentence } = await params
  const voice = request.nextUrl.searchParams.get('voice') || 'narrator'
  const mode = parseChunkingMode(request.nextUrl.searchParams)
  const chapterIdx = parseInt(chapter, 10)
  const sentenceIdx = parseInt(sentence, 10)

  if (isNaN(chapterIdx) || isNaN(sentenceIdx)) {
    return NextResponse.json({ error: 'Invalid chapter or sentence index' }, { status: 400 })
  }

  const bookService = getBookService()
  const cacheService = getCacheService()
  const ttsService = getTTSService()

  try {
    // Get sentence text (uses cached ParsedBook)
    const rawText = await bookService.getSentence(bookId, chapterIdx, sentenceIdx, mode)
    if (!rawText) {
      return NextResponse.json({ error: 'Sentence not found' }, { status: 404 })
    }

    // Apply pronunciation overrides before cache lookup
    const text = await pronunciationService.apply(rawText)

    // Check disk cache
    const cached = await cacheService.get(text, voice)
    if (cached) {
      const stats = await cacheService.getStats()
      return new NextResponse(new Uint8Array(cached), {
        headers: {
          'Content-Type': 'audio/wav',
          'Cache-Control': 'no-store',
          'X-Cache': 'HIT',
          'X-Cache-Used': stats.usedBytes.toString(),
          'X-Cache-Max': stats.maxBytes.toString(),
        },
      })
    }

    // Generate via TTS service
    const { audio } = await ttsService.generate(text, voice)

    // Cache the result
    await cacheService.set(text, voice, audio, bookId).catch(err => {
      console.error('Failed to cache TTS audio:', err)
    })
    const stats = await cacheService.getStats()

    return new NextResponse(new Uint8Array(audio), {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-store',
        'X-Cache': 'MISS',
        'X-Cache-Used': stats.usedBytes.toString(),
        'X-Cache-Max': stats.maxBytes.toString(),
      },
    })
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('TTS API unreachable')
      return NextResponse.json(
        { error: 'TTS API is not running. Please start the Python server.' },
        { status: 503 },
      )
    }

    if (error instanceof DOMException && error.name === 'TimeoutError') {
      console.warn('TTS generation timed out')
      return NextResponse.json({ error: 'TTS generation timed out' }, { status: 504 })
    }

    console.error('TTS error:', error)
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 })
  }
}
