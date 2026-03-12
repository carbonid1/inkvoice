const ROW_WIDTHS = ['w-24', 'w-20', 'w-28'] as const

export const VoiceListSkeleton = () => (
  <div role="status" aria-label="Loading voices" className="space-y-1">
    {ROW_WIDTHS.map((nameWidth, i) => (
      <div key={i} className="flex items-center gap-2 py-2.5 px-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`h-4 ${nameWidth} bg-gray-200 dark:bg-gray-700 rounded animate-pulse`} />
          <div className="h-5 w-16 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
        </div>
      </div>
    ))}
  </div>
)
