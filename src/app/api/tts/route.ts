import { NextRequest, NextResponse } from 'next/server'

const TTS_API_URL = 'http://localhost:8000/tts'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, voice } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
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
    const audioBuffer = await response.arrayBuffer()

    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        'Content-Type': 'audio/wav',
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
