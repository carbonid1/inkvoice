import { readdir, stat } from 'fs/promises'
import { NextRequest, NextResponse } from 'next/server'
import path from 'path'

const VOICES_DIR = path.join(process.cwd(), 'data', 'voices')

type ChatterboxVoiceInfo = {
  name: string
  hasSample: boolean
}

type KokoroVoiceInfo = {
  id: string
  name: string
  language: string
  gender: string
  overallGrade: string
  hasSample: boolean
}

const KOKORO_VOICES: ReadonlyArray<Omit<KokoroVoiceInfo, 'hasSample'>> = [
  { id: 'af_heart', name: 'Heart', language: 'en-us', gender: 'Female', overallGrade: 'A' },
  { id: 'af_bella', name: 'Bella', language: 'en-us', gender: 'Female', overallGrade: 'A-' },
  { id: 'af_nicole', name: 'Nicole', language: 'en-us', gender: 'Female', overallGrade: 'B-' },
  { id: 'bf_emma', name: 'Emma', language: 'en-gb', gender: 'Female', overallGrade: 'B-' },
  { id: 'af_aoede', name: 'Aoede', language: 'en-us', gender: 'Female', overallGrade: 'C+' },
  { id: 'af_kore', name: 'Kore', language: 'en-us', gender: 'Female', overallGrade: 'C+' },
  { id: 'af_sarah', name: 'Sarah', language: 'en-us', gender: 'Female', overallGrade: 'C+' },
  { id: 'am_fenrir', name: 'Fenrir', language: 'en-us', gender: 'Male', overallGrade: 'C+' },
  { id: 'am_michael', name: 'Michael', language: 'en-us', gender: 'Male', overallGrade: 'C+' },
  { id: 'am_puck', name: 'Puck', language: 'en-us', gender: 'Male', overallGrade: 'C+' },
  { id: 'af_alloy', name: 'Alloy', language: 'en-us', gender: 'Female', overallGrade: 'C' },
  { id: 'af_nova', name: 'Nova', language: 'en-us', gender: 'Female', overallGrade: 'C' },
  { id: 'bf_isabella', name: 'Isabella', language: 'en-gb', gender: 'Female', overallGrade: 'C' },
  { id: 'bm_george', name: 'George', language: 'en-gb', gender: 'Male', overallGrade: 'C' },
  { id: 'bm_fable', name: 'Fable', language: 'en-gb', gender: 'Male', overallGrade: 'C' },
  { id: 'af_sky', name: 'Sky', language: 'en-us', gender: 'Female', overallGrade: 'C-' },
  { id: 'af_jessica', name: 'Jessica', language: 'en-us', gender: 'Female', overallGrade: 'D' },
  { id: 'af_river', name: 'River', language: 'en-us', gender: 'Female', overallGrade: 'D' },
  { id: 'am_echo', name: 'Echo', language: 'en-us', gender: 'Male', overallGrade: 'D' },
  { id: 'am_eric', name: 'Eric', language: 'en-us', gender: 'Male', overallGrade: 'D' },
  { id: 'am_liam', name: 'Liam', language: 'en-us', gender: 'Male', overallGrade: 'D' },
  { id: 'am_onyx', name: 'Onyx', language: 'en-us', gender: 'Male', overallGrade: 'D' },
  { id: 'bf_alice', name: 'Alice', language: 'en-gb', gender: 'Female', overallGrade: 'D' },
  { id: 'bf_lily', name: 'Lily', language: 'en-gb', gender: 'Female', overallGrade: 'D' },
  { id: 'bm_daniel', name: 'Daniel', language: 'en-gb', gender: 'Male', overallGrade: 'D' },
  { id: 'bm_lewis', name: 'Lewis', language: 'en-gb', gender: 'Male', overallGrade: 'D+' },
  { id: 'am_adam', name: 'Adam', language: 'en-us', gender: 'Male', overallGrade: 'F+' },
  { id: 'am_santa', name: 'Santa', language: 'en-us', gender: 'Male', overallGrade: 'D-' },
]

const getChatterboxVoices = async (): Promise<ChatterboxVoiceInfo[]> => {
  try {
    const entries = await readdir(VOICES_DIR)
    const voices: ChatterboxVoiceInfo[] = []

    for (const entry of entries) {
      const entryPath = path.join(VOICES_DIR, entry)
      const entryStat = await stat(entryPath)
      if (entryStat.isDirectory()) {
        const sourcePath = path.join(entryPath, 'source.wav')
        const samplePath = path.join(entryPath, 'sample.wav')
        try {
          await stat(sourcePath)
          const hasSample = await stat(samplePath)
            .then(() => true)
            .catch(() => false)
          voices.push({ name: entry, hasSample })
        } catch {
          // No source.wav, skip
        }
      }
    }

    voices.sort((a, b) => a.name.localeCompare(b.name))
    return voices
  } catch (error) {
    console.error('Error reading voices directory:', error)
    return []
  }
}

const getKokoroVoices = async (): Promise<KokoroVoiceInfo[]> => {
  return Promise.all(
    KOKORO_VOICES.map(async voice => {
      const samplePath = path.join(VOICES_DIR, voice.id, 'sample.wav')
      const hasSample = await stat(samplePath)
        .then(() => true)
        .catch(() => false)
      return { ...voice, hasSample }
    }),
  )
}

export async function GET(request: NextRequest) {
  const model = request.nextUrl.searchParams.get('model') || 'chatterbox-turbo'

  if (model === 'kokoro') {
    return NextResponse.json(await getKokoroVoices())
  }

  return NextResponse.json(await getChatterboxVoices())
}
