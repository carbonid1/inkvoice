import { CIRCUMFERENCE, RADIUS, RING_SIZE, STROKE_WIDTH } from './ProgressRing.consts'

type ProgressRingProps = {
  progress: number
  colorClass: string
  label: string
  animate?: boolean
  pendingStyle?: 'none' | 'dashed'
  testId?: string
}

const DASH_SEGMENT = CIRCUMFERENCE / 8

export const ProgressRing = ({
  progress,
  colorClass,
  label,
  animate = false,
  pendingStyle = 'none',
  testId,
}: ProgressRingProps) => {
  const MIN_VISIBLE = 0.08
  const visibleProgress = animate ? Math.max(progress, MIN_VISIBLE) : progress
  const dashoffset = CIRCUMFERENCE * (1 - visibleProgress)

  const shouldSpin = animate && progress < 0.15
  const isDashed = !animate && pendingStyle === 'dashed'
  const center = RING_SIZE / 2

  return (
    <svg
      width={RING_SIZE}
      height={RING_SIZE}
      viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      role="img"
      aria-label={label}
      className={animate && !shouldSpin ? 'animate-buffer-pulse motion-reduce:animate-none' : ''}
    >
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
        className={`text-border ${isDashed ? 'animate-ring-drift motion-reduce:animate-none' : ''}`}
        strokeDasharray={isDashed ? `${DASH_SEGMENT * 0.6} ${DASH_SEGMENT * 0.4}` : undefined}
        style={isDashed ? { transformOrigin: `${center}px ${center}px` } : undefined}
      />
      {/* Fill */}
      <circle
        data-testid={testId}
        cx={center}
        cy={center}
        r={RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={dashoffset}
        strokeLinecap="round"
        className={`${colorClass} transition-[stroke-dashoffset,color] duration-500 ${shouldSpin ? 'animate-ring-spin motion-reduce:animate-none' : ''}`}
        style={{ transformOrigin: `${center}px ${center}px` }}
      />
    </svg>
  )
}
