import { formatDistanceToNow } from 'date-fns'

export const formatTimeAgo = (timestamp: number): string => {
  return formatDistanceToNow(timestamp, { addSuffix: true })
}
