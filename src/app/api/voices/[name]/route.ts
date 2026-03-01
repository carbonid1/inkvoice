import { voiceService } from '@/lib/services/voice/voice.service'
import { NextResponse } from 'next/server'

export const DELETE = async (
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) => {
  const { name } = await params

  if (name.includes('..') || name.includes('/')) {
    return NextResponse.json({ error: 'Invalid voice name' }, { status: 400 })
  }

  const result = await voiceService.deleteVoice(name)

  if (result.ok) {
    return NextResponse.json({ success: true })
  }

  if (result.reason === 'app_voice') {
    return NextResponse.json({ error: 'Cannot delete app voices' }, { status: 403 })
  }

  return NextResponse.json({ error: 'Voice not found' }, { status: 404 })
}
