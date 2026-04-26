import { NextResponse } from 'next/server'
import { voiceService } from '@/lib/services/voice/voice.service'
import { validateVoiceParam } from '../helpers/validateVoiceParam/validateVoiceParam'

const isTagsPayload = (v: unknown): v is { tags: string[] } => {
  if (typeof v !== 'object' || v === null || !('tags' in v)) return false
  const tags: unknown = v.tags

  return Array.isArray(tags) && tags.every(t => typeof t === 'string')
}

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ name: string }> },
) => {
  const { name } = await params

  const invalid = validateVoiceParam(name)

  if (invalid) return invalid

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!isTagsPayload(body)) {
    return NextResponse.json({ error: 'Body must contain { tags: string[] }' }, { status: 400 })
  }

  const result = await voiceService.updateVoiceTags(name, body.tags)

  if (!result.ok) {
    if (result.reason === 'app_voice') {
      return NextResponse.json({ error: 'Cannot modify tags for built-in voices' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Voice not found' }, { status: 404 })
  }

  return NextResponse.json({ tags: result.tags })
}
