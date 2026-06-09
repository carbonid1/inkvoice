import { type NextRequest, NextResponse } from 'next/server'
import { getBookService } from '@/lib/services/book/book.service'
import { getCacheService } from '@/lib/services/cache/cache.service'
import { resolveValidVoice } from '@/lib/services/voice/helpers/resolveValidVoice/resolveValidVoice'
import { DEFAULT_VOICE } from '@/lib/services/voice/voice.consts'
import { voiceService } from '@/lib/services/voice/voice.service'

interface RouteParams {
  params: Promise<{ bookId: string; chapter: string }>
}

export const GET = async (request: NextRequest, { params }: RouteParams) => {
  const { bookId, chapter } = await params
  const chapterIndex = parseInt(chapter, 10)

  if (isNaN(chapterIndex)) {
    return NextResponse.json({ error: 'Invalid chapter index' }, { status: 400 })
  }

  const requestedVoice = request.nextUrl.searchParams.get('voice') || DEFAULT_VOICE
  const { voice } = await resolveValidVoice(
    requestedVoice,
    voiceService.resolveVoicePath,
    voiceService.listVoices,
  )

  try {
    const parsedChapter = await getBookService().getChapter(bookId, chapterIndex)

    if (!parsedChapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    const cached = await getCacheService().hasMany(parsedChapter.paragraphs, voice)
    const missingParagraphs = cached.flatMap((isCached, index) => (isCached ? [] : [index]))

    return NextResponse.json({ missingParagraphs }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Failed to check audio availability:', error)
    return NextResponse.json({ error: 'Failed to check audio availability' }, { status: 500 })
  }
}
