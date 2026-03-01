import { getCacheService } from '@/lib/services/cache/cache.service'
import { getTTSService } from '@/lib/services/tts/tts.server'
import { DEFAULT_VOICE } from '@/lib/services/voice/voice.consts'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const text = body.text?.trim()
  const voice = body.voice || DEFAULT_VOICE

  if (!text) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 })
  }

  const cacheService = getCacheService()
  const ttsService = getTTSService()

  try {
    // Check disk cache (same singleton as book TTS)
    const cached = await cacheService.get(text, voice)
    if (cached) {
      return new NextResponse(new Uint8Array(cached), {
        headers: {
          'Content-Type': 'audio/wav',
          'Cache-Control': 'no-store',
          'X-Cache': 'HIT',
        },
      })
    }

    // Generate via TTS service
    const { audio } = await ttsService.generate(text, voice)

    // Cache the result
    await cacheService.set(text, voice, audio).catch(err => {
      console.error('Failed to cache TTS preview audio:', err)
    })

    return new NextResponse(new Uint8Array(audio), {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-store',
        'X-Cache': 'MISS',
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

    console.error('TTS preview error:', error)
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 })
  }
}
