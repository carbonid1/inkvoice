export const ReaderSkeleton = () => (
  <div className="p-6" role="status" aria-label="Loading chapter">
    <div className="bg-muted mb-6 h-6 w-48 animate-pulse rounded-sm" />
    <div className="space-y-4">
      <div className="bg-muted h-4 w-full animate-pulse rounded-sm" />
      <div className="bg-muted h-4 w-full animate-pulse rounded-sm" />
      <div className="bg-muted h-4 w-5/6 animate-pulse rounded-sm" />
      <div className="bg-muted h-4 w-full animate-pulse rounded-sm" />
      <div className="bg-muted h-4 w-4/5 animate-pulse rounded-sm" />
      <div className="bg-muted h-4 w-full animate-pulse rounded-sm" />
      <div className="bg-muted h-4 w-3/4 animate-pulse rounded-sm" />
    </div>
  </div>
)
