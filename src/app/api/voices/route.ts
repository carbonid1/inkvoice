import { readdir, stat } from 'fs/promises'
import { NextResponse } from 'next/server'
import path from 'path'

const VOICES_DIR = path.join(process.cwd(), 'data', 'voices')

type VoiceInfo = {
  name: string
  hasSample: boolean
}

const getVoices = async (): Promise<VoiceInfo[]> => {
  try {
    const entries = await readdir(VOICES_DIR)
    const voices: VoiceInfo[] = []

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

export async function GET() {
  return NextResponse.json(await getVoices())
}
