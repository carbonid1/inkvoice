import type { ChunkingMode } from '@/lib/types/book'

const VALID_MODES: ReadonlySet<string> = new Set(['sentence', 'paragraph'])

export const parseChunkingMode = (searchParams: URLSearchParams): ChunkingMode => {
  const raw = searchParams.get('mode')
  if (raw && VALID_MODES.has(raw)) return raw as ChunkingMode
  return 'sentence'
}
