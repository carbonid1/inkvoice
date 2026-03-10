import { escapeRegex } from '@/lib/helpers/escapeRegex/escapeRegex'

export const findMatchPositions = (text: string, query: string): number[] => {
  if (!query) return []

  const regex = new RegExp(escapeRegex(query), 'gi')
  const positions: number[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    positions.push(match.index)
  }

  return positions
}
