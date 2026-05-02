import { NextResponse } from 'next/server'
import { voiceService } from '@/lib/services/voice/voice.service'

export const POST = async () => {
  const result = await voiceService.cleanupExpiredDeletedVoices()

  return NextResponse.json(result)
}
