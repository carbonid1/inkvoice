'use client'

import { useCallback, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

export const BuildInfo = () => {
  const [visible, setVisible] = useState(false)
  const toggle = useCallback(() => setVisible(prev => !prev), [])

  useHotkeys('shift+v', toggle)

  if (!visible) return null

  const commit = process.env.NEXT_PUBLIC_GIT_COMMIT
  const message = process.env.NEXT_PUBLIC_GIT_MESSAGE

  return (
    <div className="border-border bg-card/90 fixed bottom-3 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-md border px-3 py-1.5 shadow-sm backdrop-blur-sm">
      <code className="text-primary text-xs font-medium">{commit}</code>
      {message && (
        <span className="text-muted-foreground max-w-64 truncate text-xs" title={message}>
          {message}
        </span>
      )}
    </div>
  )
}
