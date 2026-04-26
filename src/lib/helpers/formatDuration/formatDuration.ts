export const formatDuration = (ms: number): string => {
  if (ms <= 0) return ''
  const totalMinutes = Math.floor(ms / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) return `${hours}h ${minutes}m`
  if (totalMinutes === 0) return '1m'
  return `${minutes}m`
}
