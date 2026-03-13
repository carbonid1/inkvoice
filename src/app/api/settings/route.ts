import { settingsService } from '@/lib/services/settings/settings.service'
import { NextResponse } from 'next/server'

export const GET = async () => {
  const settings = await settingsService.getAll()
  return NextResponse.json(settings)
}
