import { type NextRequest, NextResponse } from 'next/server'
import { getBookService } from '@/lib/services/book/book.service'
import { getCacheService } from '@/lib/services/cache/cache.service'
import { resolveValidVoice } from '@/lib/services/voice/helpers/resolveValidVoice/resolveValidVoice'
import { DEFAULT_VOICE } from '@/lib/services/voice/voice.consts'
import { voiceService } from '@/lib/services/voice/voice.service'

interface RouteParams {
  params: Promise<{ bookId: string; chapter: string; paragraph: string }>
}

interface RequestContext {
  voice: string
  fellBack: boolean
  text: string
}

const parseRequest = async (
  request: NextRequest,
  params: RouteParams['params'],
): Promise<RequestContext | NextResponse> => {
  const { bookId, chapter, paragraph } = await params
  const requestedVoice = request.nextUrl.searchParams.get('voice') || DEFAULT_VOICE
  const { voice, fellBack } = await resolveValidVoice(
    requestedVoice,
    voiceService.resolveVoicePath,
    voiceService.listVoices,
  )
  const chapterIdx = parseInt(chapter, 10)
  const paragraphIdx = parseInt(paragraph, 10)

  if (isNaN(chapterIdx) || isNaN(paragraphIdx)) {
    return NextResponse.json({ error: 'Invalid chapter or paragraph index' }, { status: 400 })
  }

  const bookService = getBookService()
  const text = await bookService.getParagraph(bookId, chapterIdx, paragraphIdx)

  if (!text) {
    return NextResponse.json({ error: 'Paragraph not found' }, { status: 404 })
  }

  return { voice, fellBack, text }
}

export const DELETE = async (request: NextRequest, { params }: RouteParams) => {
  const result = await parseRequest(request, params)

  if (result instanceof NextResponse) return result

  const cacheService = getCacheService()
  const deleted = await cacheService.delete(result.text, result.voice)

  return NextResponse.json({ deleted })
}

export const GET = async (request: NextRequest, { params }: RouteParams) => {
  const result = await parseRequest(request, params)

  if (result instanceof NextResponse) return result

  const { voice, fellBack, text } = result
  const cacheService = getCacheService()

  const cached = await cacheService.get(text, voice)

  if (!cached) {
    return NextResponse.json({ error: 'Audio not generated' }, { status: 404 })
  }

  const stats = await cacheService.getStats()
  const headers: Record<string, string> = {
    'Content-Type': 'audio/ogg',
    'Cache-Control': 'no-store',
    'X-Cache-Used': stats.usedBytes.toString(),
    'X-Cache-Max': stats.maxBytes.toString(),
  }

  if (fellBack) headers['X-Voice-Fallback'] = 'true'

  const timestamps = await cacheService.getTimestamps(text, voice)

  if (timestamps) {
    headers['X-Word-Timestamps'] = Buffer.from(JSON.stringify(timestamps)).toString('base64')
  }

  return new NextResponse(new Uint8Array(cached), { headers })
}
