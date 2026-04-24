'use client'

import { formatBytes } from '@/lib/helpers/formatBytes/formatBytes'
import { formatDuration } from '@/lib/helpers/formatDuration/formatDuration'
import { PREGEN_JOB_STATUS } from '@/lib/services/pregenQueue/pregenQueue.types'
import { usePregenStore } from '@/store/usePregenStore'
import { useProgressStore } from '@/store/useProgressStore'
import { ContextMenu, Tooltip, toast } from '@carbonid1/design-system'
import { Download, Pause, Play, Trash2, X } from 'lucide-react'
import type { ReactElement } from 'react'

type BookCardContextMenuProps = {
  bookId: string
  onRemove: (bookId: string) => void
  children: ReactElement
}

export const BookCardContextMenu = ({ bookId, onRemove, children }: BookCardContextMenuProps) => {
  const job = usePregenStore(s => s.jobs[bookId])
  const estimate = usePregenStore(s => s.estimates[bookId])
  const isFinished = useProgressStore(s => !!s.progress[bookId]?.finishedAt)

  const handleStart = async () => {
    const response = await fetch(`/api/pregenerate/${bookId}`, { method: 'POST' })
    if (response.ok) {
      const newJob = await response.json()
      usePregenStore.getState().updateJob(newJob)
    } else if (response.status === 409) {
      const body = await response.json().catch(() => ({}))
      if (body?.budget?.ok === false) {
        toast('Cache full', {
          description: `Free ${formatBytes(body.budget.shortfallBytes)} in Settings or raise the cache limit.`,
        })
      }
    }
  }

  const patchJob = (action: 'pause' | 'resume') =>
    fetch(`/api/pregenerate/${bookId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    }).catch(console.error)

  const handlePause = () => patchJob('pause')
  const handleResume = () => patchJob('resume')
  const handleCancel = () =>
    fetch(`/api/pregenerate/${bookId}`, { method: 'DELETE' }).catch(console.error)

  const handleToggleFinished = (checked: boolean) => {
    if (checked) {
      useProgressStore.getState().markFinished(bookId)
    } else {
      useProgressStore.getState().unmarkFinished(bookId)
    }
  }

  const isFullyCached =
    estimate &&
    estimate.cachedParagraphs >= estimate.totalParagraphs &&
    estimate.totalParagraphs > 0
  const showPregenItem = !job && !isFullyCached
  const hasCachedContent = estimate && estimate.cachedParagraphs > 0
  const overBudget = estimate && !estimate.budget.ok
  const shortfallLabel =
    estimate && !estimate.budget.ok ? formatBytes(estimate.budget.shortfallBytes) : null
  const estimateLabel =
    estimate && showPregenItem
      ? `~${formatBytes(estimate.estimatedSizeBytes)} · ~${formatDuration(estimate.estimatedGenerationMinutes * 60_000)}`
      : null

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger render={children} />
      <ContextMenu.Portal>
        <ContextMenu.Positioner>
          <ContextMenu.Popup className="min-w-52">
            <ContextMenu.CheckboxItem checked={isFinished} onCheckedChange={handleToggleFinished}>
              {isFinished ? 'Mark as Unread' : 'Mark as Done'}
            </ContextMenu.CheckboxItem>

            {(showPregenItem || job) && <ContextMenu.Separator />}

            {showPregenItem && (
              <>
                {overBudget ? (
                  <Tooltip
                    label={`Free ${shortfallLabel} in Settings or raise the cache limit.`}
                    position="bottom"
                  >
                    <ContextMenu.Item disabled>
                      <Download />
                      {hasCachedContent ? 'Resume Generation' : 'Pre-generate Audio'}
                    </ContextMenu.Item>
                  </Tooltip>
                ) : (
                  <ContextMenu.Item onClick={handleStart}>
                    <Download />
                    {hasCachedContent ? 'Resume Generation' : 'Pre-generate Audio'}
                  </ContextMenu.Item>
                )}
                {estimateLabel && (
                  <p className="text-muted-foreground px-3 pb-1 text-xs">{estimateLabel}</p>
                )}
              </>
            )}

            {job?.status === PREGEN_JOB_STATUS.IN_PROGRESS && (
              <ContextMenu.Item onClick={handlePause}>
                <Pause />
                Pause Generation
              </ContextMenu.Item>
            )}

            {job?.status === PREGEN_JOB_STATUS.PAUSED && (
              <ContextMenu.Item onClick={handleResume}>
                <Play />
                Resume Generation
              </ContextMenu.Item>
            )}

            {job && job.status !== PREGEN_JOB_STATUS.COMPLETED && (
              <ContextMenu.Item onClick={handleCancel}>
                <X />
                Cancel Generation
              </ContextMenu.Item>
            )}

            <ContextMenu.Separator />

            <ContextMenu.Item variant="destructive" onClick={() => onRemove(bookId)}>
              <Trash2 />
              Remove Book
            </ContextMenu.Item>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}
