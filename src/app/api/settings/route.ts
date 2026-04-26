import { NextResponse } from 'next/server'
import { settingsService } from '@/lib/services/settings/settings.service'

export const GET = async () => {
  const settings = await settingsService.getAll()

  return NextResponse.json(settings)
}
