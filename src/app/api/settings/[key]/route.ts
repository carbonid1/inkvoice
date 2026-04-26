import { type NextRequest, NextResponse } from 'next/server'
import { settingsService } from '@/lib/services/settings/settings.service'

interface RouteParams {
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

  let body: { value: unknown }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { value } = body

  if (value === undefined) {
    return NextResponse.json({ error: 'value is required' }, { status: 400 })
  }

  try {
    await settingsService.set(key, value)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save setting:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
