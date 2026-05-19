'use client'

import { Button, Tooltip } from '@carbonid1/design-system'
import { ListMusic } from 'lucide-react'
import { usePregenStore } from '@/store/usePregenStore'

interface Props {
  className?: string
}

/**
 * Header entry point for the generation progress panel. The panel also opens
 * on its own when generation starts and toggles via the `D` hotkey — this
 * button gives it a discoverable, always-reachable handle.
 */
export const PregenPanelButton = ({ className }: Props) => {
  const togglePanel = usePregenStore(s => s.togglePanel)

  return (
    <Tooltip label="Generation queue" shortcut="D" position="bottom" className={className}>
      <Button size="icon" onClick={togglePanel} aria-label="Generation queue">
        <ListMusic />
      </Button>
    </Tooltip>
  )
}
