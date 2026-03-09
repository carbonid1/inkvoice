import { voiceService } from '@/lib/services/voice/voice.service'
import { NextResponse } from 'next/server'
import { validateVoiceParam } from './helpers/validateVoiceParam/validateVoiceParam'

export const DELETE = async (
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) => {
  const { name } = await params

  const invalid = validateVoiceParam(name)
  if (invalid) return invalid

  const result = await voiceService.deleteVoice(name)

  if (result.ok) {
    return NextResponse.json({ success: true })
  }

  if (result.reason === 'app_voice') {
    return NextResponse.json({ error: 'Cannot delete app voices' }, { status: 403 })
  }

  return NextResponse.json({ error: 'Voice not found' }, { status: 404 })
}

export const PATCH = async (
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) => {
  const { name } = await params

  const invalid = validateVoiceParam(name)
  if (invalid) return invalid

  const result = await voiceService.restoreVoice(name)

  if (result.ok) {
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'No deleted voice found' }, { status: 404 })
}
