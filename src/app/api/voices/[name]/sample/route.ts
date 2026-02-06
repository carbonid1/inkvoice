import { readFile } from 'fs/promises'
import { NextResponse } from 'next/server'
import path from 'path'

const VOICES_DIR = path.join(process.cwd(), 'data', 'voices')

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params

  // Prevent path traversal
  if (name.includes('..') || name.includes('/')) {
    return NextResponse.json({ error: 'Invalid voice name' }, { status: 400 })
  }

  const samplePath = path.join(VOICES_DIR, name, 'sample.wav')

  try {
    const buffer = await readFile(samplePath)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Sample not found' }, { status: 404 })
  }
}
