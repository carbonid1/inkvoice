import { NextRequest, NextResponse } from 'next/server'
import { getCachedAudio, cacheAudio } from '@/lib/cache'

const TTS_API_URL = 'http://localhost:8000/tts'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, bookId, chapter, sentence, voice } = body

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Check cache first if bookId is provided
    if (bookId !== undefined && chapter !== undefined && sentence !== undefined) {
      const cached = await getCachedAudio(bookId, chapter, sentence, voice)
      if (cached) {
        return new NextResponse(new Uint8Array(cached), {
          headers: {
            'Content-Type': 'audio/wav',
            'X-Cache': 'HIT',
          },
        })
      }
    }

    // Call Python TTS API
    const response = await fetch(TTS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, ...(voice && { voice }) }),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { error: `TTS API error: ${error}` },
        { status: response.status }
      )
    }

    const genTimeMs = response.headers.get('X-Generation-Time-Ms')
    const audioBuffer = Buffer.from(await response.arrayBuffer())

    // Cache the audio if bookId is provided
    if (bookId !== undefined && chapter !== undefined && sentence !== undefined) {
      await cacheAudio(bookId, chapter, sentence, audioBuffer, voice)
    }

    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        'Content-Type': 'audio/wav',
        'X-Cache': 'MISS',
        ...(genTimeMs && { 'X-Generation-Time-Ms': genTimeMs }),
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
