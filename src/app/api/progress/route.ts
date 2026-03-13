import { progressService } from '@/lib/services/progress/progress.service'
import { NextResponse } from 'next/server'

export const GET = async () => {
  const progress = await progressService.getAll()
  return NextResponse.json(progress)
}
