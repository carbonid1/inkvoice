export type EllipsisRange = { start: number; end: number }

// Detect spaced ellipsis (". . .") and multi-dot ("...") patterns
export const findEllipsisRanges = (text: string): EllipsisRange[] => {
  const ranges: EllipsisRange[] = []
  const spacedPattern = /\.( \.)+/g
  let m
  while ((m = spacedPattern.exec(text)) !== null) {
    ranges.push({ start: m.index, end: m.index + m[0].length })
  }
  const multiDotPattern = /\.{3,}/g
  while ((m = multiDotPattern.exec(text)) !== null) {
    ranges.push({ start: m.index, end: m.index + m[0].length })
  }
  return ranges
}
