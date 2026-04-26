import { type NextRequest, NextResponse } from 'next/server'
import { getCacheService } from '@/lib/services/cache/cache.service'

const MIN_CACHE_SIZE_MB = 1024 // 1 GB
const MAX_CACHE_SIZE_MB = 30 * 1024 // 30 GB

export const PUT = async (request: NextRequest) => {
  let body: { maxSizeMB: unknown }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { maxSizeMB } = body

  if (typeof maxSizeMB !== 'number' || maxSizeMB < MIN_CACHE_SIZE_MB) {
    return NextResponse.json(
      { error: `maxSizeMB must be at least ${MIN_CACHE_SIZE_MB}` },
      { status: 400 },
    )
  }

  if (maxSizeMB > MAX_CACHE_SIZE_MB) {
    return NextResponse.json(
      { error: `maxSizeMB cannot exceed ${MAX_CACHE_SIZE_MB}` },
      { status: 400 },
    )
  }

  try {
    const cacheService = getCacheService()

    await cacheService.setMaxSizeMB(maxSizeMB)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update cache config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
