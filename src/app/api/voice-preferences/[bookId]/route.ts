import { voicePreferenceService } from '@/lib/services/voice-preference/voice-preference.service'
import { NextRequest, NextResponse } from 'next/server'

type RouteParams = {
  params: Promise<{
    bookId: string
  }>
}

export const PUT = async (request: NextRequest, { params }: RouteParams) => {
  const { bookId } = await params

  try {
    const body = await request.json()
    const { voiceName } = body as { voiceName: unknown }

    if (typeof voiceName !== 'string' || voiceName.length === 0) {
      return NextResponse.json({ error: 'voiceName must be a non-empty string' }, { status: 400 })
    }

    await voicePreferenceService.set(bookId, voiceName)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
}

export const DELETE = async (_request: NextRequest, { params }: RouteParams) => {
  const { bookId } = await params
  const removed = await voicePreferenceService.remove(bookId)

  if (!removed) {
    return NextResponse.json({ error: 'Voice preference not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
