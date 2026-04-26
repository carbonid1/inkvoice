'use client'

import { Tooltip } from '@carbonid1/design-system'
import { CircleDot, Loader2 } from 'lucide-react'
import { useTTSLifecycleStore } from '@/lib/hooks/useTTSLifecycle/useTTSLifecycle'
import type { LifecycleState } from '@/lib/services/pythonClient/pythonClient.types'

const TOOLTIP_LABEL: Record<LifecycleState, string> = {
  stopped: 'Voice engine idle',
  starting: 'Voice engine starting',
  ready: 'Voice engine ready',
  stopping: 'Voice engine stopping',
}

const PILL_TEXT: Record<Exclude<LifecycleState, 'stopped'>, string> = {
  starting: 'Starting',
  ready: 'Ready',
  stopping: 'Stopping',
}

export interface TTSStatusPillProps {
  state?: LifecycleState
}

export const TTSStatusPill = ({ state: stateOverride }: TTSStatusPillProps = {}) => {
  const liveState = useTTSLifecycleStore(s => s.state)
  const state = stateOverride ?? liveState

  if (state === 'stopped') return null

  const isAnimating = state === 'starting' || state === 'stopping'
  const Icon = isAnimating ? Loader2 : CircleDot

  return (
    <Tooltip label={TOOLTIP_LABEL[state]} position="bottom">
      <div
        className="border-border bg-card/90 fixed top-3 right-3 z-50 inline-flex items-center gap-1.5 rounded-full border px-2 py-1 shadow-sm backdrop-blur-sm"
        aria-label={TOOLTIP_LABEL[state]}
      >
        <Icon
          className={`text-primary size-3 ${isAnimating ? 'animate-spin' : ''}`}
          fill={state === 'ready' ? 'currentColor' : 'none'}
        />
        <span className="text-muted-foreground text-xs font-medium">{PILL_TEXT[state]}</span>
      </div>
    </Tooltip>
  )
}
