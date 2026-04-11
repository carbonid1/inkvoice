import { env } from '@/lib/config/env'
import { NextResponse } from 'next/server'
import { validateVoiceParam } from '../helpers/validateVoiceParam/validateVoiceParam'

export const POST = async (request: Request, { params }: { params: Promise<{ name: string }> }) => {
  const { name } = await params

  const invalid = validateVoiceParam(name)
  if (invalid) return invalid

  try {
    const { text } = await request.json()
    if (typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const response = await fetch(env.ttsApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim(), voice: name }),
      signal: AbortSignal.timeout(300_000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const audioBuffer = await response.arrayBuffer()
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/ogg',
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Preview generation failed' }, { status: 500 })
  }
}
