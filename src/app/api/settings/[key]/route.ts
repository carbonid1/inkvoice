import { settingsService } from '@/lib/services/settings/settings.service'
import { NextRequest, NextResponse } from 'next/server'

type RouteParams = {
  params: Promise<{
    key: string
  }>
}

export const GET = async (_request: NextRequest, { params }: RouteParams) => {
  const { key } = await params
  const value = await settingsService.get(key)

  if (value === null) {
    return NextResponse.json({ error: 'Setting not found' }, { status: 404 })
  }

  return NextResponse.json({ value })
}

export const PUT = async (request: NextRequest, { params }: RouteParams) => {
  const { key } = await params

  try {
    const body = await request.json()
    const { value } = body as { value: unknown }

    if (value === undefined) {
      return NextResponse.json({ error: 'value is required' }, { status: 400 })
    }

    await settingsService.set(key, value)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
}

export const DELETE = async (_request: NextRequest, { params }: RouteParams) => {
  const { key } = await params
  const removed = await settingsService.remove(key)

  if (!removed) {
    return NextResponse.json({ error: 'Setting not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
