import { type NextRequest, NextResponse } from 'next/server'
import { voicePreferenceService } from '@/lib/services/voice-preference/voice-preference.service'

export const GET = async () => {
  const preferences = await voicePreferenceService.getAll()

  return NextResponse.json(preferences)
}

export const DELETE = async (request: NextRequest) => {
  const voiceName = request.nextUrl.searchParams.get('voiceName')

  if (!voiceName) {
    return NextResponse.json({ error: 'voiceName query parameter is required' }, { status: 400 })
  }

  const count = await voicePreferenceService.removeByVoiceName(voiceName)

  return NextResponse.json({ deleted: count })
}
