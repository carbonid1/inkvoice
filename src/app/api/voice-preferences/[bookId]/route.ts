import { voicePreferenceService } from '@/lib/services/voice-preference/voice-preference.service'
import { NextRequest, NextResponse } from 'next/server'

type RouteParams = {
  params: Promise<{
    bookId: string
  }>
}

export const PUT = async (request: NextRequest, { params }: RouteParams) => {
  const { bookId } = await params

  let body: { voiceName: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { voiceName } = body

  if (typeof voiceName !== 'string' || voiceName.length === 0) {
    return NextResponse.json({ error: 'voiceName must be a non-empty string' }, { status: 400 })
  }

  try {
    await voicePreferenceService.set(bookId, voiceName)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to set voice preference:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
