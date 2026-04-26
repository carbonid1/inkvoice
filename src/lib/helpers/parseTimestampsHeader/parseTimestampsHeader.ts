import { type WordTimestamp, wordTimestampArraySchema } from '@/lib/types/wordTimestamp'

const tryParse = (text: string): WordTimestamp[] | null => {
  try {
    const parsed = wordTimestampArraySchema.safeParse(JSON.parse(text))

    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export const parseTimestampsHeader = (response: Response): WordTimestamp[] | null => {
  const header = response.headers.get('X-Word-Timestamps')

  if (!header) return null

  // Try plain JSON first (Python API → Next.js route)
  const direct = tryParse(header)

  if (direct) return direct

  // Fall back to base64-encoded JSON (Next.js route → browser)
  try {
    const decoded =
      typeof Buffer !== 'undefined' ? Buffer.from(header, 'base64').toString('utf-8') : atob(header)

    return tryParse(decoded)
  } catch {
    return null
  }
}
