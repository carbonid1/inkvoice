'use server'

import { pronunciationService } from '@/lib/services/pronunciation/pronunciation.service'
import { NextRequest, NextResponse } from 'next/server'

export const GET = async () => {
  const map = await pronunciationService.getMap()
  return NextResponse.json(map)
}

export const PUT = async (request: NextRequest) => {
  try {
    const body = await request.json()
    const entries = body.entries as Record<string, string> | undefined

    if (!entries || typeof entries !== 'object') {
      return NextResponse.json({ error: 'Body must contain an "entries" object' }, { status: 400 })
    }

    await pronunciationService.writeMap(entries)
    return NextResponse.json(entries)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
}
