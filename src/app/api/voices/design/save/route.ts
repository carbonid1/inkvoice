import { NextResponse } from 'next/server'
import { getPythonClient } from '@/lib/services/pythonClient/pythonClient'
import { voiceService } from '@/lib/services/voice/voice.service'

export const POST = async (request: Request) => {
  try {
    const formData = await request.formData()
    const name = formData.get('name')
    const refText = formData.get('refText')
    const audio = formData.get('audio')

    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Voice name is required', code: 'MISSING_NAME' },
        { status: 400 },
      )
    }
    if (typeof refText !== 'string' || !refText.trim()) {
      return NextResponse.json(
        { error: 'Reference text is required', code: 'MISSING_REF_TEXT' },
        { status: 400 },
      )
    }
    if (!(audio instanceof Blob)) {
      return NextResponse.json(
        { error: 'Audio payload is required', code: 'MISSING_AUDIO' },
        { status: 400 },
      )
    }

    const buffer = Buffer.from(await audio.arrayBuffer())
    const tags = formData
      .getAll('tags')
      .filter((value): value is string => typeof value === 'string')
    const result = await voiceService.saveDesignedVoice(name.trim(), buffer, refText, tags)

    if (!result.ok) {
      const status = result.code === 'NAME_TAKEN' ? 409 : 400

      return NextResponse.json({ error: result.message, code: result.code }, { status })
    }

    generateNarratorPreview(result.name).catch(error => {
      console.error(`Failed to generate preview for "${result.name}":`, error)
    })

    return NextResponse.json({
      name: result.name,
      displayName: result.displayName,
      durationSeconds: result.durationSeconds,
    })
  } catch (error) {
    console.error('Error saving designed narrator:', error)
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL' }, { status: 500 })
  }
}

const PREVIEW_TEXT =
  'The library was hushed at this hour, and only the slow turning of pages broke the quiet. ' +
  'Outside, a lamp burned low against the long blue evening, and somewhere a clock counted off the minutes.'

const generateNarratorPreview = async (voiceName: string) => {
  const response = await getPythonClient().fetch('/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: PREVIEW_TEXT, voice: voiceName }),
    signal: AbortSignal.timeout(300_000),
  })

  if (!response.ok) {
    throw new Error(`TTS API returned ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()

  await voiceService.saveSample(voiceName, Buffer.from(arrayBuffer))
  console.warn(`Generated preview clip for narrator "${voiceName}"`)
}
