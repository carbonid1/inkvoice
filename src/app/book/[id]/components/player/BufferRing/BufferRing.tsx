'use client'

import { Tooltip } from '@/components/Tooltip/Tooltip'
import { CIRCUMFERENCE, MAX_AHEAD, RADIUS, RING_SIZE, STROKE_WIDTH } from './BufferRing.consts'
import { getBufferColor } from './helpers/getBufferColor/getBufferColor'
import { getBufferLabel } from './helpers/getBufferLabel/getBufferLabel'

type BufferRingProps = {
  ahead: number
  isGenerating: boolean
}

export const BufferRing = ({ ahead, isGenerating }: BufferRingProps) => {
  const progress = Math.min(ahead / MAX_AHEAD, 1)
  const dashoffset = CIRCUMFERENCE * (1 - progress)
  const colorClass = getBufferColor(ahead)
  const label = getBufferLabel(ahead, isGenerating)

  return (
    <Tooltip label={label} delay={600}>
      <div className="flex cursor-default items-center justify-center p-1.5">
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          role="img"
          aria-label={label}
          className={isGenerating ? 'animate-buffer-pulse motion-reduce:animate-none' : ''}
        >
          {/* Track */}
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE_WIDTH}
            className="text-border"
          />
          {/* Fill */}
          <circle
            data-testid="buffer-ring-fill"
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
            className={`${colorClass} transition-[stroke-dashoffset,color] duration-500`}
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        </svg>
      </div>
    </Tooltip>
  )
}
