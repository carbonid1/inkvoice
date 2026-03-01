import { parseChunkingMode } from '@/app/api/helpers/parseChunkingMode/parseChunkingMode'
import { getBookService } from '@/lib/services/book/book.service'
import { getCacheService } from '@/lib/services/cache/cache.service'
import { pronunciationService } from '@/lib/services/pronunciation/pronunciation.service'
import { getTTSService } from '@/lib/services/tts/tts.server'
import { TTSError } from '@/lib/services/tts/tts.types'
import { resolveValidVoice } from '@/lib/services/voice/helpers/resolveValidVoice/resolveValidVoice'
import { DEFAULT_VOICE } from '@/lib/services/voice/voice.consts'
import { voiceService } from '@/lib/services/voice/voice.service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string; chapter: string; sentence: string }> },
) {
  const { bookId, chapter, sentence } = await params
  const requestedVoice = request.nextUrl.searchParams.get('voice') || DEFAULT_VOICE
  const { voice, fellBack } = await resolveValidVoice(
    requestedVoice,
    voiceService.resolveVoicePath,
    voiceService.listVoices,
  )
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
