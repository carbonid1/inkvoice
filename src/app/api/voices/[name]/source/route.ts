import { voiceService } from '@/lib/services/voice/voice.service'
import { readFile } from 'fs/promises'
import { NextResponse } from 'next/server'

export const GET = async (_request: Request, { params }: { params: Promise<{ name: string }> }) => {
  const { name } = await params

  if (name.includes('..') || name.includes('/')) {
    return NextResponse.json({ error: 'Invalid voice name' }, { status: 400 })
  }

  const voicePath = await voiceService.resolveVoicePath(name)
  if (!voicePath) {
    return NextResponse.json({ error: 'Source not found' }, { status: 404 })
  }

  try {
    const buffer = await readFile(voicePath)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Source not found' }, { status: 404 })
  }
}
