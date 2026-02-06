import { readdir, stat } from 'fs/promises'
import { NextResponse } from 'next/server'
import path from 'path'

const VOICES_DIR = path.join(process.cwd(), 'data', 'voices')

interface VoiceInfo {
  name: string
  hasSample: boolean
}

export async function GET() {
  try {
    const entries = await readdir(VOICES_DIR)

    // Filter to directories that contain a source.wav file
    const voices: VoiceInfo[] = []
    for (const entry of entries) {
      const entryPath = path.join(VOICES_DIR, entry)
      const entryStat = await stat(entryPath)
      if (entryStat.isDirectory()) {
        const sourcePath = path.join(entryPath, 'source.wav')
        const samplePath = path.join(entryPath, 'sample.wav')
        try {
          await stat(sourcePath)
          // Check if sample.wav exists
          let hasSample = false
          try {
            await stat(samplePath)
            hasSample = true
          } catch {
            // No sample.wav
          }
          voices.push({ name: entry, hasSample })
        } catch {
          // No source.wav, skip this directory
        }
      }
    }

    voices.sort((a, b) => a.name.localeCompare(b.name))
    return NextResponse.json(voices)
  } catch (error) {
    console.error('Error reading voices directory:', error)
    return NextResponse.json([], { status: 200 })
  }
}
