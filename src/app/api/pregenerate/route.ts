import { pregenQueueService } from '@/lib/services/pregenQueue/pregenQueue.service'
import { NextResponse } from 'next/server'

export const GET = async () => {
  const jobs = await pregenQueueService.getAll()
  return NextResponse.json(jobs)
}
