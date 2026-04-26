import { NextResponse } from 'next/server'
import { pregenQueueService } from '@/lib/services/pregenQueue/pregenQueue.service'

export const GET = async () => {
  const jobs = await pregenQueueService.getAll()

  return NextResponse.json(jobs)
}
