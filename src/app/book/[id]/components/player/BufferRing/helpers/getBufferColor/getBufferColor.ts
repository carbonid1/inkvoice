import { THRESHOLD_FULL, THRESHOLD_READY, THRESHOLD_WARMING } from '../../BufferRing.consts'

export const getBufferColor = (ahead: number): string => {
  if (ahead >= THRESHOLD_FULL) return 'text-success'
  if (ahead >= THRESHOLD_READY) return 'text-primary'
  if (ahead >= THRESHOLD_WARMING) return 'text-muted-foreground'
  return 'text-muted-foreground/40'
}
