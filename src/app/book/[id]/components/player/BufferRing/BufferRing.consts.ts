import { MAX_PREFETCH_AHEAD } from '@/lib/hooks/usePrefetchQueue/usePrefetchQueue'

export const MAX_AHEAD = MAX_PREFETCH_AHEAD

// SVG geometry for a 16px ring
export const RING_SIZE = 16
export const STROKE_WIDTH = 2
export const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2
export const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// Buffer state thresholds (paragraph count)
export const THRESHOLD_WARMING = 1
export const THRESHOLD_READY = 11
export const THRESHOLD_FULL = 61
