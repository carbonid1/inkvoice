'use client'

import { ContextMenu } from '@carbonid1/design-system'
import { Copy, RefreshCw } from 'lucide-react'
import type { ReactElement } from 'react'

interface ParagraphContextMenuProps {
  chapter: number
  paragraph: number
  onCopyText: (chapter: number, paragraph: number) => void
  onRegenerate: (chapter: number, paragraph: number) => void | Promise<void>
  children: ReactElement
}

export const ParagraphContextMenu = ({
  chapter,
  paragraph,
  onCopyText,
  onRegenerate,
  children,
}: ParagraphContextMenuProps) => (
  <ContextMenu.Root>
    <ContextMenu.Trigger render={children} />
    <ContextMenu.Portal>
      <ContextMenu.Positioner>
        <ContextMenu.Popup>
          <ContextMenu.Item onClick={() => onCopyText(chapter, paragraph)}>
            <Copy />
            Copy Text
          </ContextMenu.Item>
          <ContextMenu.Item onClick={() => onRegenerate(chapter, paragraph)}>
            <RefreshCw />
            Regenerate Audio
          </ContextMenu.Item>
        </ContextMenu.Popup>
      </ContextMenu.Positioner>
    </ContextMenu.Portal>
  </ContextMenu.Root>
)
