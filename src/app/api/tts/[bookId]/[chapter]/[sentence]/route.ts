import { getBookService } from '@/lib/services/book/book.service'
import { getCacheService } from '@/lib/services/cache/cache.service'
import { getTTSService } from '@/lib/services/tts/tts.server'
import { TTSError } from '@/lib/services/tts/tts.types'
import { resolveValidVoice } from '@/lib/services/voice/helpers/resolveValidVoice/resolveValidVoice'
import { DEFAULT_VOICE } from '@/lib/services/voice/voice.consts'
import { voiceService } from '@/lib/services/voice/voice.service'
import { NextRequest, NextResponse } from 'next/server'

type RouteParams = { params: Promise<{ bookId: string; chapter: string; sentence: string }> }

type RequestContext = {
  bookId: string
  voice: string
  fellBack: boolean
  text: string
}

const parseRequest = async (
  request: NextRequest,
  params: RouteParams['params'],
): Promise<RequestContext | NextResponse> => {
  const { bookId, chapter, sentence } = await params
  const requestedVoice = request.nextUrl.searchParams.get('voice') || DEFAULT_VOICE
  const { voice, fellBack } = await resolveValidVoice(
    requestedVoice,
    voiceService.resolveVoicePath,
    voiceService.listVoices,
  )
  const chapterIdx = parseInt(chapter, 10)
  const sentenceIdx = parseInt(sentence, 10)

  if (isNaN(chapterIdx) || isNaN(sentenceIdx)) {
    return NextResponse.json({ error: 'Invalid chapter or sentence index' }, { status: 400 })
  }

  const bookService = getBookService()
  const text = await bookService.getSentence(bookId, chapterIdx, sentenceIdx)
  if (!text) {
    return NextResponse.json({ error: 'Sentence not found' }, { status: 404 })
  }

  return { bookId, voice, fellBack, text }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const result = await parseRequest(request, params)
  if (result instanceof NextResponse) return result

  const cacheService = getCacheService()
  const deleted = await cacheService.delete(result.text, result.voice)
  return NextResponse.json({ deleted })
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const result = await parseRequest(request, params)
  if (result instanceof NextResponse) return result

  const { voice, fellBack, text, bookId } = result
  const cacheService = getCacheService()
  const ttsService = getTTSService()

  try {
    const makeHeaders = (xCache: string, stats: { usedBytes: number; maxBytes: number }) => {
      const headers: Record<string, string> = {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-store',
        'X-Cache': xCache,
        'X-Cache-Used': stats.usedBytes.toString(),
        'X-Cache-Max': stats.maxBytes.toString(),
      }
      if (fellBack) headers['X-Voice-Fallback'] = 'true'
      return headers
    }

    // Check disk cache
    const cached = await cacheService.get(text, voice)
    if (cached) {
      const stats = await cacheService.getStats()
      return new NextResponse(new Uint8Array(cached), {
        headers: makeHeaders('HIT', stats),
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
      headers: makeHeaders('MISS', stats),
    })
  } catch (error) {
    if (error instanceof TTSError && error.code === 'VOICE_NOT_FOUND') {
      return NextResponse.json({ error: error.message, code: 'VOICE_NOT_FOUND' }, { status: 404 })
    }

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
