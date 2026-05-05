import { NextResponse } from 'next/server'
import { generateAndSaveSample } from '@/lib/services/voice/helpers/generateAndSaveSample/generateAndSaveSample'
import { voiceService } from '@/lib/services/voice/voice.service'
import { voiceSampleEvents } from '@/lib/services/voiceSampleEvents/voiceSampleEvents.service'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const SAMPLE_TEXT =
  'Night gathers, and now my watch begins. It shall not end until my death. ' +
  'I shall take no wife, hold no lands, father no children. I shall wear no crowns and win no glory. ' +
  'I shall live and die at my post. I am the sword in the darkness. I am the watcher on the walls. ' +
  'I am the shield that guards the realms of men.'

export const GET = async () => {
  try {
    const voices = await voiceService.listVoices()

    return NextResponse.json(voices)
  } catch (error) {
    console.error('Error listing voices:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export const POST = async (request: Request) => {
  try {
    const contentLength = Number(request.headers.get('content-length') ?? 0)

    if (contentLength > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large', code: 'TOO_LARGE' }, { status: 413 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const name = formData.get('name')
    const language = formData.get('language')

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No audio file provided', code: 'MISSING_FILE' },
        { status: 400 },
      )
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Voice name is required', code: 'MISSING_NAME' },
        { status: 400 },
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const langStr = typeof language === 'string' && language.trim() ? language.trim() : undefined
    const result = await voiceService.uploadVoice(name.trim(), buffer, file.name, langStr)

    if (!result.ok) {
      const status = result.code === 'NAME_TAKEN' ? 409 : 400

      return NextResponse.json({ error: result.message, code: result.code }, { status })
    }

    generateAndSaveSample(result.name, SAMPLE_TEXT).catch(error => {
      console.error(`Failed to generate sample for "${result.name}":`, error)
      voiceSampleEvents.publish(result.name, 'failed')
    })

    return NextResponse.json({
      name: result.name,
      displayName: result.displayName,
      durationSeconds: result.durationSeconds,
      transcription: result.transcription,
      tags: [],
    })
  } catch (error) {
    console.error('Error uploading voice:', error)
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL' }, { status: 500 })
  }
}
