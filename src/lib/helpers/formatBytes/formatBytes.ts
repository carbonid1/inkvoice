const MB = 1024 * 1024
const GB = 1024 * MB

export const formatBytes = (bytes: number): string => {
  if (bytes < MB) return '1 MB'
  if (bytes >= GB) return `${(bytes / GB).toFixed(1)} GB`
  return `${Math.round(bytes / MB)} MB`
}
