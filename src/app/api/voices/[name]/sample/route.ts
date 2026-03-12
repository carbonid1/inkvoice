import { voiceService } from '@/lib/services/voice/voice.service'
import { readFile } from 'fs/promises'
import { NextResponse } from 'next/server'
import { validateVoiceParam } from '../helpers/validateVoiceParam/validateVoiceParam'

export const HEAD = async (
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) => {
  const { name } = await params

  const invalid = validateVoiceParam(name)
  if (invalid) return invalid

  const samplePath = await voiceService.resolveSamplePath(name)

  if (!samplePath) {
    return new NextResponse(null, { status: 404 })
  }

  return new NextResponse(null, { status: 200 })
}

export const GET = async (_request: Request, { params }: { params: Promise<{ name: string }> }) => {
  const { name } = await params

  const invalid = validateVoiceParam(name)
  if (invalid) return invalid

  const samplePath = await voiceService.resolveSamplePath(name)

  if (!samplePath) {
    return NextResponse.json({ error: 'Sample not found' }, { status: 404 })
  }

  try {
    const buffer = await readFile(samplePath)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Sample not found' }, { status: 404 })
  }
}
