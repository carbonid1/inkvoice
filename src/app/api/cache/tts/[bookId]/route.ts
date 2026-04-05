import { getCacheService } from '@/lib/services/cache/cache.service'
import { NextRequest, NextResponse } from 'next/server'

type RouteParams = { params: Promise<{ bookId: string }> }

export const DELETE = async (_request: NextRequest, { params }: RouteParams) => {
  const { bookId } = await params

  try {
    const cacheService = getCacheService()
    const freedBytes = await cacheService.deleteByBookId(bookId)
    return NextResponse.json({ freedBytes })
  } catch (error) {
    console.error('Failed to delete book cache:', error)
    return NextResponse.json({ error: 'Failed to delete book cache' }, { status: 500 })
  }
}
