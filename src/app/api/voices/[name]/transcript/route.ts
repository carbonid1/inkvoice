import { NextResponse } from 'next/server'
import { voiceService } from '@/lib/services/voice/voice.service'
import { validateVoiceParam } from '../helpers/validateVoiceParam/validateVoiceParam'

export const PUT = async (request: Request, { params }: { params: Promise<{ name: string }> }) => {
  const { name } = await params

  const invalid = validateVoiceParam(name)

  if (invalid) return invalid

  try {
    const { text } = await request.json()

    if (typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const result = await voiceService.saveTranscript(name, text)

    if (!result.ok) {
      return NextResponse.json({ error: 'Voice not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
