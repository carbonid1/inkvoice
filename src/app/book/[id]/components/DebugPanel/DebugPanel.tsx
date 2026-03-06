'use client'

import type { DebugMetrics } from '@/lib/types/debug'
import { useDisplayStore } from '@/store/useDisplayStore'
import { usePrefetchStore } from '@/store/usePrefetchStore'

type DebugPanelProps = {
  metrics: DebugMetrics
  visible: boolean
}

export const DebugPanel = ({ metrics, visible }: DebugPanelProps) => {
  const chunkingMode = useDisplayStore(s => s.chunkingMode)
  const prefetchEnabled = usePrefetchStore(s => s.enabled)
  const togglePrefetch = usePrefetchStore(s => s.toggle)
  if (!visible) return null

  const cachePercent =
    metrics.cacheMaxMB > 0 ? Math.round((metrics.cacheUsedMB / metrics.cacheMaxMB) * 100) : 0

  return (
    <div className="fixed top-4 right-4 bg-black/80 text-green-400 font-mono text-xs p-3 rounded-lg shadow-lg z-50 min-w-[140px]">
      <div className="text-gray-400 mb-1 text-[10px] uppercase tracking-wider">Debug Panel (D)</div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {metrics.isGenerating ? (
            <>
              <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <span className="inline-block w-2 h-2 bg-green-400 rounded-full" />
              <span>Ready</span>
            </>
          )}
        </div>
        <div>Ahead: {metrics.ahead}</div>
        <div>
          Cache: {metrics.cacheUsedMB ?? 0}MB / {metrics.cacheMaxMB ?? 800}MB ({cachePercent}%)
        </div>
        <div>
          {chunkingMode === 'paragraph' ? 'Paragraph' : 'Sentence'}: {metrics.currentSentence + 1}/
          {metrics.totalSentences}
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
          className="w-full text-left hover:text-green-300 transition-colors cursor-pointer"
        >
          Prefetch: {prefetchEnabled ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  )
}
