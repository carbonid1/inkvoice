'use client'

import type { ReactNode } from 'react'
import { usePregenSSE } from '@/lib/hooks/usePregenSSE/usePregenSSE'
import { useSleepPrevention } from '@/lib/hooks/useSleepPrevention/useSleepPrevention'
import { useTTSLifecycle } from '@/lib/hooks/useTTSLifecycle/useTTSLifecycle'
import { DebugPanel } from './components/DebugPanel/DebugPanel'

interface Props {
  children: ReactNode
}

export const PregenSSEProvider = ({ children }: Props) => {
  usePregenSSE()
  useSleepPrevention()
  useTTSLifecycle()
  return (
    <>
      {children}
      <DebugPanel />
    </>
  )
}
