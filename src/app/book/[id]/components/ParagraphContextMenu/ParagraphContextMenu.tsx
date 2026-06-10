'use client'

import { ContextMenu } from '@carbonid1/design-system'
import { Copy } from 'lucide-react'
import type { ReactElement } from 'react'

interface ParagraphContextMenuProps {
  chapter: number
  paragraph: number
  onCopyText: (chapter: number, paragraph: number) => void
  children: ReactElement
}

export const ParagraphContextMenu = ({
  chapter,
  paragraph,
  onCopyText,
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
        </ContextMenu.Popup>
      </ContextMenu.Positioner>
    </ContextMenu.Portal>
  </ContextMenu.Root>
)
