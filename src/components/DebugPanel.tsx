'use client'

export interface DebugMetrics {
  lastGenTimeMs: number | null
  lastCacheStatus: 'HIT' | 'MISS' | null
  queueDepth: number
  prefetchedCount: number
  bufferSize: number
  bufferFilled: number
}

interface DebugPanelProps {
  metrics: DebugMetrics
  visible: boolean
}

export function DebugPanel({ metrics, visible }: DebugPanelProps) {
  if (!visible) return null

  return (
    <div className="fixed top-4 right-4 bg-black/80 text-green-400 font-mono text-xs p-3 rounded-lg shadow-lg z-50 min-w-[160px]">
      <div className="text-gray-400 mb-1 text-[10px] uppercase tracking-wider">
        Debug Panel (D)
      </div>
      <div className="space-y-1">
        <div>
          Gen: {metrics.lastGenTimeMs !== null ? `${metrics.lastGenTimeMs}ms` : '—'}
        </div>
        <div>
          Cache: {metrics.lastCacheStatus ?? '—'}
        </div>
        <div>
          Queue: {metrics.queueDepth}
        </div>
        <div>
          Prefetched: {metrics.prefetchedCount}
        </div>
        <div className="mt-2">
          <div className="flex justify-between mb-1">
            <span>Buffer:</span>
            <span>{metrics.bufferFilled}/{metrics.bufferSize}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(metrics.bufferFilled / metrics.bufferSize) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
