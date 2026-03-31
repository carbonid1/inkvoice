'use client'

import type { DebugMetrics } from '@/lib/types/debug'
import { usePrefetchStore } from '@/store/usePrefetchStore'

type DebugPanelProps = {
  metrics: DebugMetrics
  visible: boolean
}

export const DebugPanel = ({ metrics, visible }: DebugPanelProps) => {
  const prefetchEnabled = usePrefetchStore(s => s.enabled)
  const togglePrefetch = usePrefetchStore(s => s.toggle)
  if (!visible) return null

  const cachePercent =
    metrics.cacheMaxMB > 0 ? Math.round((metrics.cacheUsedMB / metrics.cacheMaxMB) * 100) : 0

  return (
    <div className="fixed top-4 right-4 z-50 min-w-[140px] rounded-lg bg-black/80 p-3 font-mono text-xs text-green-400 shadow-lg">
      <div className="mb-1 text-[10px] tracking-wider text-gray-400 uppercase">Debug Panel (D)</div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {metrics.isGenerating ? (
            <>
              <span className="inline-block size-2 animate-pulse rounded-full bg-yellow-400" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <span className="inline-block size-2 rounded-full bg-green-400" />
              <span>Ready</span>
            </>
          )}
        </div>
        <div>Ahead: {metrics.ahead}</div>
        <div>
          Cache: {metrics.cacheUsedMB ?? 0}MB / {metrics.cacheMaxMB ?? 800}MB ({cachePercent}%)
        </div>
        <div>
          Paragraph: {metrics.currentParagraph + 1}/{metrics.totalParagraphs}
          {metrics.totalChapters > 1 && (
            <span>
              {' '}
              Chapter {metrics.currentChapter + 1}/{metrics.totalChapters}
            </span>
          )}
        </div>
        <button
          onClick={togglePrefetch}
          aria-pressed={prefetchEnabled}
          className="w-full text-left transition-colors hover:text-green-300"
        >
          Prefetch: {prefetchEnabled ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  )
}
