import type { WordTimestamp } from '@/lib/types/wordTimestamp'

export const parseTimestampsHeader = (response: Response): WordTimestamp[] | null => {
  const header = response.headers.get('X-Word-Timestamps')
  if (!header) return null

  try {
    // Try plain JSON first (Python API → Next.js route)
    return JSON.parse(header) as WordTimestamp[]
  } catch {
    // Fall back to base64-encoded JSON (Next.js route → browser)
    try {
      const json =
        typeof Buffer !== 'undefined'
          ? Buffer.from(header, 'base64').toString('utf-8')
          : atob(header)
      return JSON.parse(json) as WordTimestamp[]
    } catch {
      return null
    }
  }
}
