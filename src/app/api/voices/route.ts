import { NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import path from 'path'

const VOICES_DIR = path.join(process.cwd(), 'data', 'voices')

export async function GET() {
  try {
    const files = await readdir(VOICES_DIR)
    const voices = files
      .filter((file) => file.endsWith('.wav'))
      .map((file) => file.replace('.wav', ''))
      .sort()

    return NextResponse.json(voices)
  } catch (error) {
    console.error('Error reading voices directory:', error)
    return NextResponse.json([], { status: 200 })
  }
}
