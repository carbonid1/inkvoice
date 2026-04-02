const PRESET_ROW_WIDTHS = ['w-24', 'w-20', 'w-28', 'w-20', 'w-24', 'w-28'] as const

export const VoiceListSkeleton = () => (
  <div role="status" aria-label="Loading voices" className="space-y-4">
    <div>
      <div className="bg-muted mb-2 h-3 w-20 animate-pulse rounded-sm" />
      <div className="bg-muted h-9 w-28 animate-pulse rounded-md" />
    </div>

    <div>
      <div className="bg-muted mb-2 h-3 w-28 animate-pulse rounded-sm" />
      <div className="space-y-1">
        {PRESET_ROW_WIDTHS.map((nameWidth, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className={`h-4 ${nameWidth} bg-muted animate-pulse rounded-sm`} />
              <div className="bg-muted h-5 w-16 animate-pulse rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)
