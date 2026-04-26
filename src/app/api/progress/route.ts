import { NextResponse } from 'next/server'
import { progressService } from '@/lib/services/progress/progress.service'

export const GET = async () => {
  const progress = await progressService.getAll()

  return NextResponse.json(progress)
}
