'use client'

import { usePregenSSE } from '@/lib/hooks/usePregenSSE/usePregenSSE'
import { useSleepPrevention } from '@/lib/hooks/useSleepPrevention/useSleepPrevention'
import type { ReactNode } from 'react'
import { DebugPanel } from './components/DebugPanel/DebugPanel'

type Props = {
  children: ReactNode
}

export const PregenSSEProvider = ({ children }: Props) => {
  usePregenSSE()
  useSleepPrevention()
  return (
    <>
      {children}
      <DebugPanel />
    </>
  )
}
