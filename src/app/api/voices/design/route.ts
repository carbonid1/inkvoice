import { NextResponse } from 'next/server'
import { getTTSService } from '@/lib/services/tts/tts.server'
import { TTSError } from '@/lib/services/tts/tts.types'

const MAX_TEXT_LENGTH = 1000
const MAX_INSTRUCT_LENGTH = 200
const TEMPERATURE_MIN = 0
const TEMPERATURE_MAX = 1
const SEED_MAX = 2_147_483_647 // int32 ceiling — matches torch.manual_seed range

export const POST = async (request: Request) => {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'INVALID_JSON' }, { status: 400 })
  }

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null
  const rawText = isRecord(body) ? body.text : undefined
  const rawInstruct = isRecord(body) ? body.instruct : undefined
  const rawTemperature = isRecord(body) ? body.classTemperature : undefined
  const rawSeed = isRecord(body) ? body.seed : undefined
  const text = typeof rawText === 'string' ? rawText.trim() : ''
  const instruct = typeof rawInstruct === 'string' ? rawInstruct.trim() : ''

  if (!text) {
    return NextResponse.json({ error: 'Text is required', code: 'MISSING_TEXT' }, { status: 400 })
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: 'Text is too long', code: 'TEXT_TOO_LONG' }, { status: 400 })
  }
  if (!instruct) {
    return NextResponse.json(
      { error: 'Voice description is required', code: 'MISSING_INSTRUCT' },
      { status: 400 },
    )
  }
  if (instruct.length > MAX_INSTRUCT_LENGTH) {
    return NextResponse.json(
      { error: 'Voice description is too long', code: 'INSTRUCT_TOO_LONG' },
      { status: 400 },
    )
  }

  let classTemperature: number | undefined

  if (rawTemperature !== undefined && rawTemperature !== null) {
    if (
      typeof rawTemperature !== 'number' ||
      !Number.isFinite(rawTemperature) ||
      rawTemperature < TEMPERATURE_MIN ||
      rawTemperature > TEMPERATURE_MAX
    ) {
      return NextResponse.json(
        { error: 'Variation must be between 0 and 1', code: 'INVALID_TEMPERATURE' },
        { status: 400 },
      )
    }
    classTemperature = rawTemperature
  }

  let seed: number | undefined

  if (rawSeed !== undefined && rawSeed !== null) {
    if (
      typeof rawSeed !== 'number' ||
      !Number.isInteger(rawSeed) ||
      rawSeed < 0 ||
      rawSeed > SEED_MAX
    ) {
      return NextResponse.json(
        { error: 'Seed must be a non-negative integer', code: 'INVALID_SEED' },
        { status: 400 },
      )
    }
    seed = rawSeed
  }

  try {
    // WAV so the client can both play it back and round-trip it to /save without
    // any transcoding. Larger than Opus, but it's a desktop-local app.
    const result = await getTTSService().design(text, instruct, {
      format: 'wav',
      classTemperature,
      seed,
    })

    return new Response(new Uint8Array(result.audio), {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-store',
        'X-Generation-Time-Ms': String(result.generationTimeMs),
        'X-Audio-Duration-Ms': String(result.durationMs),
      },
    })
  } catch (error) {
    const rawMessage =
      error instanceof TTSError ? error.message : 'Voice generation failed unexpectedly'
    const status = error instanceof TTSError ? error.statusCode : 500

    console.error('Error designing voice:', error)
    return NextResponse.json({ error: extractDetail(rawMessage), code: 'TTS_FAILED' }, { status })
  }
}

// FastAPI returns errors as `{"detail": "..."}`. Surface the inner string so
// the client doesn't show raw JSON. Falls back to the original text.
const extractDetail = (raw: string): string => {
  try {
    const parsed: unknown = JSON.parse(raw)

    if (parsed && typeof parsed === 'object' && 'detail' in parsed) {
      const { detail } = parsed

      if (typeof detail === 'string') return detail
    }
  } catch {
    // not JSON, fall through
  }
  return raw
}
