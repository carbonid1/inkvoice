import { NextResponse } from 'next/server'

export const validateVoiceParam = (name: string): NextResponse | null =>
  name.includes('..') || name.includes('/')
    ? NextResponse.json({ error: 'Invalid voice name' }, { status: 400 })
    : null
